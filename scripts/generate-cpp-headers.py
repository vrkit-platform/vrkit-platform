#!/usr/bin/python

"""
Generates struct & enum nodes based on specified CamX headers.
"""

from enum import Enum
from functools import reduce
import argparse
import os
import re
import subprocess
import sys
import tempfile
import warnings

import CppHeaderParser


def str_or_first(value):
    return value if isinstance(value, str) else value[0]


def strip_camx(s):
    return re.sub("^CamX::", "", s)


def to_list_ptr(s):
    return re.sub("\\s?\\*+", "*", strip_camx(s))


def to_type_name(s):
    """
    Strip pointer, namespace & other type
    annotations, leaving a bare string

    :param s: source/raw typedef

    :return:
    """
    s = strip_camx(s)
    return s if re.match("char\\s?\\*", s) else re.sub("\\s?\\*+", "", s)


class TypeKind(Enum):
    UNKNOWN = "UNKNOWN"
    VALUE = "VALUE"
    TUPLE = "TUPLE"
    LIST = "LIST"


class EnumDef:
    def __init__(self, name, values, cppEnum):
        self.name = name
        self.values = [[value["name"], value["value"]] for value in values]
        self.valueDefault = f"{name}::{self.values[0][0]}"
        self.cppEnum = cppEnum


NodeValueTypeMap = {
    "uint8_t": ["UInt8", "uint8_t", "0"],
    "uint16_t": ["UInt16", "uint16_t", "0"],
    "uint32_t": ["UInt32", "uint32_t", "0"],
    "uint64_t": ["UInt64", "uint64_t", "0"],
    "int8_t": ["Int8", "int8_t", "0"],
    "int16_t": ["Int16", "int16_t", "0"],
    "int32_t": ["Int32", "int32_t", "0"],
    "int64_t": ["Int64", "int64_t", "0"],
    "bool": ["Bool", "bool", "false"],
    "float": ["Float", "float", "0f"],
    "double": ["Double", "double", "0.0"],
    "char*": ["String", "std::string", '""'],
}


class Templates:
    Value = "DSValue({valueType},{type})"
    ValueCtor = 'DSValueCtor({valueType},{type},"{name}",{value},this)'
    OptValue = "DSOptValue({valueType},{type})"
    OptValueCtor = 'DSOptValueCtor({valueType},{type},"{name}",{value},this)'

    TupleValue = "DSTupleValue({tupleType})"
    TupleValueCtor = 'DSTupleValueCtor({tupleType},"{name}", this)'
    TupleOptValue = "DSTupleOptValue({tupleType})"
    TupleOptValueCtor = 'DSTupleOptValueCtor({tupleType},"{name}", this)'

    ListValue = "DSListValue({type})"
    ListValueCtor = 'DSListValueCtor({type},"{name}",this)'

    ArrayValue = "DSArrayValue({type})"
    ArrayValueCtor = 'DSArrayValueCtor({type},"{name}",this)'

    PropContainer = "DSPropContainer({name}, {index})"
    Prop = "DSProp({type}, {name}, {index})"
    PropEnum = "DSPropEnum({type}, {name}, {index})"

    # PropArray = "DSPropArray({name}, {index})"
    PropList = "DSPropList({name}, {index})"
    PropReadOnly = "DSPropRO({type}, {name}, {index})"

    EnumDef = """
enum class {name}  {{
  {values}
}};

class DataSetNodeValue{name}
      : public DataSetNodeValue<DataSetNodeValueType::Enum, {name}> {{
   public:
    DataSetNodeValue{name}(
        const std::string& name = "",
        {name} value = {valueDefault},
        DataSetNode* parent = nullptr,
        bool isRoot = false)
        : DataSetNodeValue(name, value, parent, isRoot){{}};
  }};
  class DataSetNodeOptionalValue{name}
      : public DataSetNodeOptionalValue<DataSetNodeValueType::Enum, {name}> {{
   public:
    DataSetNodeOptionalValue{name}(
        const std::string& name = "",
        std::optional<{name}> value = {valueDefault},
        DataSetNode* parent = nullptr,
        bool isRoot = false)
        : DataSetNodeOptionalValue(name, value, parent, isRoot){{}};
  }};

"""
    TupleDecl = """
class {clazz} ;
"""
    TupleNode = """
class {clazz} : public DataSetNodeStruct<
  {types}
> {{
 public:
    static constexpr std::string_view ModuleName{{"{clazz}"}};

    explicit {clazz}(const std::string& name = "", DataSetNode* parent = nullptr)
      : DataSetNodeStruct(
            name,
            {{
                {nodes}
            }},
            parent) {{}}

   {props}

   {childAtMethod}

    virtual std::shared_ptr<DataSetNode> newChild() override {{
       return std::make_shared<{clazz}>();
    }};

    static std::shared_ptr<DataSetNode> newInstance() {{
       return std::make_shared<{clazz}>();
    }};
}};

"""


def generate_nodes(args):
    verbose = args.verbose

    headerFiles = args.header

    outfile = str_or_first(args.outfile)

    # skipFormat = args.skip_format

    try:
        if verbose:
            CppHeaderParser.debug = 1
            CppHeaderParser.debug_trace = 1

        cppHeaders = [
            CppHeaderParser.CppHeader(headerFile) for headerFile in headerFiles
        ]

    except CppHeaderParser.CppParseError as e:
        print(e)
        sys.exit(1)

    ArrayFields = [
        "StreamConfiguration.vc",
        "StreamConfiguration.vcMap",
        "RegisterSetting.registerData",
        "ModeSwitchRegisterInformation.PDAFVCAddress",
    ]

    def is_array_field(clazz: str, prop: str):
        return f"{clazz}.{prop}" in ArrayFields

    NamespaceUsed = [str_or_first(args.dataset_namespace)]
    Namespace = str_or_first(args.ns)

    #  Prepare output data
    outputHeaderData = [
        """
    #pragma once
    #include {dataset_include}
    namespace {ns} {{
    {nsUsed}
    """.format(
            dataset_include=str_or_first(args.dataset_include),
            ns=Namespace,
            nsUsed=reduce(
                lambda txt, ns: txt + f"using namespace {ns};\n", NamespaceUsed, ""
            ),
        )
    ]

    clazzLists = list(
        map(
            lambda header: list(
                map(
                    lambda kv: [kv[0], kv[1]["name"], kv[1]["properties"]],
                    header.classes.items(),
                )
            ),
            cppHeaders,
        )
    )

    typedefLists = list(
        map(
            lambda header: list(map(lambda kv: kv, header.typedefs.items())), cppHeaders
        )
    )

    enumLists = list(
        map(
            lambda header: list(
                map(
                    lambda enumData: [enumData["name"], enumData["values"], enumData],
                    header.enums,
                )
            ),
            cppHeaders,
        )
    )

    typedefList = reduce(
        lambda tdList, allTypedefList: allTypedefList + tdList, typedefLists, list()
    )

    clazzListWithProps = reduce(
        lambda clazzList, allClazzList: allClazzList + clazzList, clazzLists, list()
    )

    enumListWithValues = reduce(
        lambda enumList, allEnumList: allEnumList + enumList, enumLists, list()
    )

    allClazzNames = list(map(lambda data: data[1], clazzListWithProps))
    allEnumNames = list(map(lambda data: data[0], enumListWithValues))

    enumDefMap = {
        name: EnumDef(name, values, cppEnum)
        for [name, values, cppEnum] in enumListWithValues
    }

    def is_clazz_name(name):
        return allClazzNames.count(name) > 0

    def is_enum_name(name):
        """
        Check if a `name` is an `Enum`

        :param name:
        :return:
        """
        return allEnumNames.count(name) > 0

    # A map to store type definitions
    typeDefMap = dict()

    class TypeDef:
        """
        Hold a metadata and resolution
        information for a c/c++ `typedef`
        """

        name = None
        def_type = None
        resolved_type = None
        resolved_src = None
        node_value_type = None

        is_list = False
        resolved = False

        def __init__(self, name: str, def_type: str):
            """
            Initialize `TypeDef`

            :param name:
            :param def_type:
            """
            self.name = strip_camx(name)
            self.def_type = to_list_ptr(def_type)
            self.def_type_base = to_type_name(def_type)
            self.resolve()

        def __str__(self) -> str:
            """
            Dump object props to string

            :return:
            """
            return f"""name={self.name},def_type={self.def_type},def_type_base={self.def_type_base},
                resolved_type={self.resolved_type},node_value_type={self.node_value_type},
                is_list={self.is_list},resolved={self.resolved}
                """

        def resolve(self):
            """

            :return:
            """
            if self.resolved:
                return

            def_base_type = self.def_type_base
            def_type = self.def_type
            self.node_value_type = (
                NodeValueTypeMap[def_base_type]
                if def_base_type in NodeValueTypeMap
                else None
            )

            if self.node_value_type is None:
                self.is_list = def_type.endswith("*") or "List" in def_base_type
                if is_enum_name(def_base_type):
                    self.resolved_type = def_base_type
                    self.resolved_src = "enum"
                    self.resolved = True
                elif is_clazz_name(def_base_type):
                    self.resolved_type = def_base_type
                    self.resolved_src = "class"
                    self.resolved = True
            else:
                self.resolved_type = self.node_value_type[1]
                self.resolved_src = "value"
                self.resolved = True

            if not self.resolved:
                print(f"Unknown type {self.to_string()}")

        def to_string(self) -> str:
            return self.__str__()

    for [k, v] in typedefList:
        typeDefMap[strip_camx(k)] = TypeDef(k, v)

    for [k, v] in typeDefMap.items():
        if not v.resolved:
            typeDefMap[k].resolve()

    # Generate enums
    for enumDetails in enumListWithValues:
        [name, valueList, enumSrc] = enumDetails
        valueDefault = enumDefMap[name].valueDefault
        values = ""
        valueCount = len(valueList)
        for idx in range(valueCount):
            values += f"{valueList[idx]['name']} = {valueList[idx]['value']}"
            if idx < valueCount - 1:
                values += ",\n"
        enumDef = Templates.EnumDef.format(
            name=name, values=values, valueDefault=valueDefault, type=name
        )
        print(f"ENUM DEF: {name}\n\n{enumDef}")
        outputHeaderData.append(enumDef)

    def generateChildAtMethod(memberCount):
        getters = ""
        for i in range(memberCount):
            getters += f"""
            if (idx == {i}) {{
                return reinterpret_cast<DataSetNode*>(std::get<{i}>(this->value()).get());
            }}
            """

        return f"""
                virtual DataSetNode* child(size_t idx) override {{
                    {getters}

                    return nullptr;
                }};

                virtual size_t childCount() override {{
                    return {memberCount};
                }}
            """

    tupleDecls = ""
    tupleDefs = ""
    tupleNames = []
    for [k, clazz, props] in clazzListWithProps:
        if clazz.endswith("Class"):
            continue

        if tupleNames.count(clazz):
            continue

        tupleNames.append(clazz)

        # clazz, nodes, props, templateArgs
        # TODO: Populate templates
        # tempBag = {'clazz': clazz}
        tempTypes = ""
        tempNodes = ""
        tempProps = ""

        print(f"{k}\t{clazz}\n")
        memberIdx = 0
        props = props["public"]
        propCount = len(props)
        propIdx = 0
        while propIdx < propCount:
            if (
                    "SymbolTableID" in props[propIdx]["name"]
            ):  # or "module_version" in props[propIdx]['name']:
                propIdx += 1
                continue

            isOptional = False
            propIsList = False

            # CHECK FOR OPTIONAL FIELD FIRST
            if props[propIdx]["name"].endswith("Exists"):
                propIdx += 2
                isOptional = True
                if propIdx >= propCount:
                    break

            prop = props[propIdx]
            propName = prop["name"]

            #  CHECK IF ITS A LIST
            if propIdx + 2 < propCount:
                prop2 = props[propIdx + 2]
                if propName.endswith("Count") and (
                        prop2["pointer"] == 1 or prop2["type"].endswith("*")
                ):

                    # IF THIS IS A LIST AND WE OVER
                    # RESOLVED THE TYPE, THEN ADD AN
                    # ASTERISK BACK IN
                    if not prop2["type"].endswith("*"):
                        prop2["type"] += "*"
                    propIdx += 2
                    propIsList = True
                    if propIdx >= propCount:
                        break

            isLast = propIdx + 1 >= propCount
            prop = props[propIdx]
            propName = prop["name"]

            declType = to_list_ptr(prop["type"])
            declTypeBase = to_type_name(declType)
            propType = (
                NodeValueTypeMap[declTypeBase]
                if declTypeBase in NodeValueTypeMap
                else None
            )
            propIsArray = is_array_field(clazz, propName)
            propIsEnum = is_enum_name(declTypeBase)
            propKind = TypeKind.LIST if propIsList else TypeKind.UNKNOWN
            propIsList = (
                    propIsArray
                    or propIsList
                    or declType.endswith("*")
                    or prop["pointer"] == 1
            )
            if propType is not None:
                if propKind is not TypeKind.LIST:
                    propKind = TypeKind.VALUE
            elif propIsEnum:
                if propKind is not TypeKind.LIST:
                    propKind = TypeKind.VALUE
                propType = ["Enum", declTypeBase]
            elif is_clazz_name(declTypeBase):
                propType = declTypeBase
                propKind = (
                    propKind if propKind is not TypeKind.UNKNOWN else TypeKind.TUPLE
                )
            elif declTypeBase in typeDefMap:
                typedef = typeDefMap[declTypeBase]
                propType = typedef.resolved_type
                if typedef.resolved_src == "class":
                    propKind = TypeKind.TUPLE
                elif typedef.is_list:
                    propKind = TypeKind.LIST
                    propIsList = True
                elif typedef.resolved_src == "enum" or typedef.resolved_src == "value":
                    propKind = TypeKind.VALUE
                    if typedef.resolved_src == "enum":
                        propType = ["Enum", propType]
                    elif propType in NodeValueTypeMap:
                        propType = NodeValueTypeMap[propType]
                    else:
                        raise RuntimeError(f"Can not map {propType}")
                else:
                    warnings.warn(
                        f"Prop kind is could not be determined ({typedef.to_string()})", stacklevel=2
                    )
                    continue
            else:
                warnings.warn(f"Unable to resolve declType({declType})", stacklevel=2)
                continue

            if isinstance(propType, str):
                if propType in NodeValueTypeMap:
                    propType = NodeValueTypeMap[propType]
                # elif propKind == TypeKind.VALUE:
                else:
                    propType = [propType, propType]

            if propKind == TypeKind.VALUE:
                valueTemp = Templates.Value if not isOptional else Templates.OptValue
                valueCtorTemp = (
                    Templates.ValueCtor if not isOptional else Templates.OptValueCtor
                )
                valueDefault = "0"
                if isOptional:
                    valueDefault = "std::nullopt"
                elif propType[1] == "std::string":
                    valueDefault = '""'
                elif propType[0] == "Enum":
                    valueDefault = enumDefMap[to_type_name(propType[1])].valueDefault

                tempTypes += valueTemp.format(valueType=propType[0], type=propType[1])
                tempNodes += valueCtorTemp.format(
                    valueType=propType[0],
                    type=propType[1],
                    name=prop["name"],
                    value=valueDefault,
                )
                tempProps += (
                    Templates.PropEnum.format(
                        type=propType[1], name=prop["name"], index=memberIdx
                    )
                    if propIsEnum
                    else Templates.Prop.format(
                        type=propType[1], name=prop["name"], index=memberIdx
                    )
                )
                memberIdx += 1

            elif propKind == TypeKind.TUPLE:
                """
                If a TUPLE/STRUCT, then use specific templates
                """
                tempTypes += (
                    Templates.TupleOptValue if isOptional else Templates.TupleValue
                ).format(tupleType=propType[1])
                tempNodes += (
                    Templates.TupleOptValueCtor
                    if isOptional
                    else Templates.TupleValueCtor
                ).format(tupleType=propType[1], name=prop["name"])
                tempProps += Templates.PropContainer.format(
                    name=prop["name"], index=memberIdx
                )

                memberIdx += 1

            elif propKind == TypeKind.LIST:
                """
                If a LIST then a complex type selection and templates are used
                """
                typeType = propType[1]
                typeName = prop["name"]
                listType = "DataSetNodeArray" if propIsArray else "DataSetNodeList"
                if typeType in NodeValueTypeMap or propIsEnum:
                    basicType = (
                        [typeType, typeType]
                        if propIsEnum
                        else NodeValueTypeMap[typeType]
                    )
                    typeType = f"DataSetNodeValue{basicType[0]}"
                    tempType = f"{listType}<{typeType}>"
                    tempTypes += tempType
                    tempNodes += f'std::make_shared<{tempType}>("{typeName}", std::vector<std::shared_ptr<{typeType}>>{{}}, this, false)'
                else:
                    tempTypes += (
                        Templates.ArrayValue if propIsArray else Templates.ListValue
                    ).format(type=typeType)
                    tempNodes += (
                        Templates.ArrayValueCtor
                        if propIsArray
                        else Templates.ListValueCtor
                    ).format(type=typeType, name=typeName)

                tempProps += Templates.PropList.format(name=typeName, index=memberIdx)
                memberIdx += 1

            else:
                warnings.warn(f"unable to support {propKind} yet", stacklevel=2)
                propIdx += 1
                continue

            if not isLast:
                tempTypes += ",\n"
                tempNodes += ",\n"

            tempProps += ";\n"

            propIdx += 1

        tupleDecls += "\n" + Templates.TupleDecl.format(clazz=clazz, types=tempTypes)

        clazzOutput = Templates.TupleNode.format(
            clazz=clazz,
            types=tempTypes,
            nodes=tempNodes,
            props=tempProps,
            childAtMethod=generateChildAtMethod(memberIdx),
        )
        print(f"{clazzOutput}\n\n")
        tupleDefs += "\n" + clazzOutput

    outputHeaderData.append(tupleDecls)
    outputHeaderData.append(tupleDefs)

    outputHeaderData.append(
        """
        }}
        """
    )

    outputBuf = "\n".join(outputHeaderData)
    # targetFilename = "CamXDataSetNodesGenerated.h"
    print(f"Outfile: {outfile}")
    targetFilename = outfile

    with tempfile.TemporaryDirectory() as tmpdir:
        tmpFilename = os.path.join(tmpdir, "camx-header-temp.h")
        print(f"Wrote temp file {tmpFilename}")
        with open(tmpFilename, "w") as f:
            f.write(outputBuf)

        outFilename = targetFilename
        # os.path.join(os.getcwd(), targetFilename)
        print(f"Formatting temp file {tmpFilename}")
        with open(outFilename, "w") as out:
            subprocess.run(["clang-format", tmpFilename], stdout=out, check=True)

        print(f"Wrote formatted output file {outFilename}")


def main():
    p = argparse.ArgumentParser(
        description=__doc__,
    )
    p.add_argument(
        "--header",
        "--headers",
        nargs="*",
        required=True,
        help="Header files to process",
    )
    p.add_argument(
        "-n",
        "--ns",
        "--namespace",
        nargs=1,
        default="OVR::Sensors::Config::CamX::Nodes",
        help="Namespace to place structs & enums in",
    )

    p.add_argument(
        "--dataset_include",
        default='"DataSet/DataSet.h"',
        nargs=1,
        help="DO NOT CHANGE UNLESS YOU KNOW WHY: Header file include statement to gain DataSet types",
    )
    p.add_argument(
        "--dataset_namespace",
        nargs=1,
        default="OVR::Sensors::Config::CamX",
        help="DO NOT CHANGE UNLESS YOU KNOW WHY: Namespace where DataSet & the underlying data set library exists",
    )
    p.add_argument(
        "--verbose",
        action="store_true",
        help="Debug logging",
    )
    p.add_argument(
        "--outfile",
        nargs=1,
        required=True,
        default="include/CamXFileManager/CamXDataSetNodesGenerated.h",
        help="The header file to generate with all structs & enums",
    )
    p.add_argument(
        "--skip_format",
        action="store_true",
        help="Skip post process clang-format",
    )

    args = p.parse_args()
    generate_nodes(args)


if __name__ == "__main__":
    main()
