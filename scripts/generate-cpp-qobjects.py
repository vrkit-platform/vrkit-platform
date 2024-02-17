#!/usr/bin/python

"""
Generates struct & enum nodes based on specified CamX headers.
"""
import glob
from enum import Enum
from functools import reduce, cmp_to_key
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
    "std::int32_t": ["std::int32_t"],
    "bool": ["bool"],
    "float": ["float"],
    "double": ["double"],
    "std::string": ["QString"],
    "std::vector": ["QList", 1]
}

class QObjectDef:
    def __init__(self, name, qname, clazz_def, deps, members):
        self.name = name
        self.qname = qname
        self.clazz_def = clazz_def
        self.deps = deps
        self.members = members

    def __lt__(self, other):
        other_qname = other.qname
        other_clazz_def = other.clazz_def
        self_deps_other = other_qname in self.clazz_def
        other_deps_self = self.qname in other_clazz_def
        return -1 if other.qname in self.deps else 1


def generate_nodes(args):
    verbose = args.verbose

    header_file_globs = args.header
    header_files = []

    for header_file_glob in header_file_globs:
        header_files.extend(filter(lambda filename: "Parse" not in filename, glob.glob(header_file_glob)))

    outfile = str_or_first(args.outfile)

    # skipFormat = args.skip_format

    try:
        if verbose:
            CppHeaderParser.debug = 1
            CppHeaderParser.debug_trace = 1

        cpp_headers = [
            CppHeaderParser.CppHeader(header_file) for header_file in header_files
        ]

    except CppHeaderParser.CppParseError as e:
        print(e)
        sys.exit(1)

    ns = str_or_first(args.ns)

    clazz_lists = list(
        map(
            lambda header: list(
                map(
                    lambda kv: [kv[0], kv[1]["name"], kv[1]["properties"]],
                    header.classes.items(),
                )
            ),
            cpp_headers,
        )
    )

    clazz_list_with_props = reduce(
        lambda clazz_list, all_clazz_list: all_clazz_list + clazz_list, clazz_lists, list()
    )
    all_clazz_names = list(map(lambda data: data[1], clazz_list_with_props))

    def is_clazz_name(name):
        return all_clazz_names.count(name) > 0

    # noinspection PyShadowingNames
    def to_qprop_type(full_prop_type: str):
        base_type_exp = re.compile("([A-Za-z0-9_:]+)<([A-Za-z0-9_:]+)>")
        base_type_match = base_type_exp.match(full_prop_type)

        prop_type = full_prop_type
        child_type = None
        if base_type_match is not None:
            matches = base_type_match.groups()
            prop_type = matches[0]
            child_type = matches[1]

        if is_clazz_name(prop_type):
            qname = f"App{prop_type}"
            return qname, f"QSharedPointer<{qname}>", prop_type

        if prop_type not in NodeValueTypeMap:
            raise TypeError(f"Unknown type ({prop_type}), can not transform")

        type_conf = NodeValueTypeMap[prop_type]
        if len(type_conf) == 0:
            raise ValueError(f"Invalid type config ({prop_type}), can not transform")

        base_type = type_conf[0]
        if len(type_conf) == 1 or int(type_conf[1]) < 1 or child_type is None:
            return base_type, base_type, base_type

        qsub_type,qsub_type_ptr,__ = to_qprop_type(child_type)
        return f"{base_type}<{qsub_type_ptr}>", qsub_type_ptr, child_type

    qobject_defs = dict()

    for [k, clazz, props] in clazz_list_with_props:
        print(f"Class {clazz}")
        # qobject_def = qobject_defs[clazz]
        qobject_def_members = {}
        clazz_deps = []
        pub_props = props["public"]
        prop_defs = ""
        ctor_defs = ""
        var_defs = ""
        for prop in pub_props:
            prop_name = prop["name"]
            prop_type = prop['type']
            if prop_name in qobject_def_members:
                warnings.warn(f"{prop_name} already defined for {clazz}")
                continue

            qprop_type, qsub_prop_type, child_prop_type = to_qprop_type(prop_type)
            prop_def = f"Q_PROPERTY({qprop_type} {prop_name} MEMBER {prop_name} NOTIFY changed)"
            var_def = f"{qprop_type} {prop_name}{{}};"

            ctor_param_exp = f"value.{prop_name}"
            if qprop_type is "QString":
                ctor_param_exp = f"QString::fromStdString({ctor_param_exp})"
            elif qprop_type.startswith("QList"):
                ctor_param_exp = f"ToQList<{child_prop_type},{qsub_prop_type}>({ctor_param_exp}, parent)"
                prop_def = f"Q_PROPERTY({qprop_type} {prop_name} MEMBER {prop_name} NOTIFY changed)"
                var_def = f"{qprop_type} {prop_name}{{}};"

            elif qprop_type.startswith("App"):
                if qprop_type not in clazz_deps:
                    clazz_deps.append(qprop_type)
                var_def = f"{qsub_prop_type} {prop_name}{{}};"
                prop_def = f"Q_PROPERTY({qsub_prop_type} {prop_name} MEMBER {prop_name} NOTIFY changed)"
                ctor_param_exp = f"{qsub_prop_type}::create({ctor_param_exp}, parent)"

            prop_defs += prop_def + "\n"
            var_defs += var_def + "\n"
            ctor_def = f", {prop_name}({ctor_param_exp})"
            ctor_defs += ctor_def

            qobject_member = {
                "name": prop_name,
                "deps": clazz_deps,
                "py_type": prop_type,
                "prop_def": prop_def,
                "var_def": var_def
            }

            print(f"\t{prop_name}: {prop_type} -> {qprop_type}")

            qobject_def_members[prop_name] = qobject_member
        qname = f"App{clazz}"

        # qobject_def["prop_defs"] = prop_defs
        # qobject_def["ctor_defs"] = ctor_defs
        # qobject_def["var_defs"] = var_defs

        clazz_def = f"""
class {qname} : public QObject {{
  Q_OBJECT
  {prop_defs}
  
  public:
  {var_defs}
  explicit {qname}(const IRacingTools::SDK::SessionInfo::{clazz}& value = {{}}, QObject * parent = nullptr) : QObject(parent){ctor_defs}{{}};
  
  signals:
    void changed();

}};
"""
        # qobject_def["name"] = clazz
        # qobject_def["qname"] = qname
        # qobject_def["members"] = qobject_def_members
        # qobject_def["clazz_def"] = clazz_def
        qobject_defs[clazz] = QObjectDef(clazz,qname,clazz_def, clazz_deps, qobject_def_members)
        # if clazz in clazz_defs:
        #     clazz_defs = clazz_def + "\n\n" + clazz_defs
        # else:
        #     clazz_defs += "\n\n" + clazz_def

    all_qobject_defs = list(qobject_defs.values())
    all_qobject_defs.sort()
    sorted_qobject_defs = []
    fulfilled_deps = []
    while len(all_qobject_defs) > 0:
        # fulfilled_defs = []
        for qobject_def in all_qobject_defs:
            all_deps_ok = True
            for dep in qobject_def.deps:
                if dep not in fulfilled_deps:
                    all_deps_ok = False
                    break
            if not all_deps_ok:
                continue

            sorted_qobject_defs.append(qobject_def)
            # fulfilled_defs.append(qobject_def.qname)
            fulfilled_deps.append(qobject_def.qname)

        all_qobject_defs = list(filter(lambda o: o.qname not in fulfilled_deps, all_qobject_defs))

    # clazz_fwd_decls = ""
    # for qobject_def in sorted_qobject_defs:
    #     clazz_fwd_decls += f"class {qobject_def.qname};\n"

    clazz_defs = ""
    for qobject_def in sorted_qobject_defs:
        clazz_defs += qobject_def.clazz_def + "\n\n"

    output_content = """
#pragma once

#include <QtCore>
#include <QList>
#include "ModelTransform.h"
#include <IRacingTools/SDK/SessionInfo/SessionInfoMessage.h>
namespace {ns} {{
    using namespace IRacingTools::SDK::SessionInfo;
    
    {clazz_defs}
}}
""".format(
        # dataset_include=str_or_first(args.dataset_include),
        ns=ns,
        clazz_defs=clazz_defs
    )

    with open(outfile, "w") as out:
        out.write(output_content)

    print(f"Wrote output file {outfile}")


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
        default="IRacingTools::App::Models",
        help="Namespace to place objects in",
    )

    p.add_argument(
        "--verbose",
        action="store_true",
        help="Debug logging",
    )
    p.add_argument(
        "--outfile",
        # nargs=1,
        # required=True,
        default="packages/cpp-apps/app-ui-qt/src/app/models/AppSessionInfoGeneratedModels.h",
        help="The header file to generate with QObjects",
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
