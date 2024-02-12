import json
import os
import string
from enum import Enum
from string import Template

import yaml
from datetime import date

with open("Y:\\code\\sim-racing\\irsdk-interop\\etc\\schema\\iracing_session_info.sample.yaml", "r") as fp:
    data = yaml.load(fp, Loader=yaml.Loader)


class DataType(Enum):
    unknown = "unknown",
    string = "string",
    integer = "integer",
    boolean = "boolean",
    float = "float",
    object = "object",
    list = "list"


def get_key_hints(word: str):
    key_hints = [word]
    for suffix in ['s']:
        if word.endswith(suffix):
            key_hints.append(word[:-len(suffix)])
    return key_hints


class Prop:
    def __init__(
            self,
            name: str,
            data_type: DataType,
            index_data_type: DataType = DataType.unknown,
            index_data_mapping=None
    ):
        self.index_data_mapping = index_data_mapping
        self.index_data_type = index_data_type
        self.name = name
        self.data_type = data_type


class Mapping:
    def __init__(self, name: str, props=None):
        if props is None:
            props = {}

        self.name = name
        self.props = props


mappings: dict[str, Mapping] = {}


# def make_prop_from(key, value):


def find_or_create_mapping(key, value):
    key_hints = get_key_hints(key)
    for key_hint in key_hints:
        if key_hint in mappings:
            return mappings[key_hint]

    name = key_hints[len(key_hints) - 1]
    mapping = Mapping(name=name)
    mappings[name] = mapping
    visit(mapping, value)
    return mapping


def make_prop_from(key, value):
    index_data_type = DataType.unknown
    index_data_mapping = None
    if isinstance(value,dict):
        data_type = DataType.object
        index_data_mapping = find_or_create_mapping(key, value)
    elif isinstance(value,list):
        data_type = DataType.list

        # TODO: implement get_data_type, which if a dict and a matching member set is found
        if len(value):
            list_item_value = value[0]
            if isinstance(list_item_value, dict):
                index_data_type = DataType.object
                index_data_mapping = find_or_create_mapping(key, list_item_value)
            else:
                match type(list_item_value):
                    case date():
                        index_data_type = DataType.integer
                    case str():
                        index_data_type = DataType.string
                    case bool():
                        index_data_type = DataType.boolean
                    case float():
                        index_data_type = DataType.float
                    case int():
                        index_data_type = DataType.integer
                    case list():
                        raise "list can not have direct list as child"
    else:
        match value:
            case date():
                data_type = DataType.integer
            case None:
                data_type = DataType.string
            case str():
                data_type = DataType.string
            case bool():
                data_type = DataType.boolean
            case float():
                data_type = DataType.float
            case int():
                data_type = DataType.integer
            case _:
                raise ValueError(f"Unknown data type: {type(value)}")

    return Prop(key, data_type, index_data_type, index_data_mapping)


def visit(mapping: Mapping, node: dict):
    for key, value in node.items():
        mapping.props[key] = make_prop_from(key, value)
        # if isinstance(value, dict):
        #     visit(mapping, value)
        # else:
        #     print(f"{key}: {type(value)}")
        #     mapping.props[key] = make_prop_from(mappings, key, value)


mapping = Mapping(name="SessionInfoMessage")
mappings[mapping.name] = mapping
visit(mapping, data)


convert_template = Template(
    """
    template<>
  struct convert<$name> {
    static Node encode(const $name & rhs) {
      Node node;
      $encoders
      return node;
    }

    static bool decode(const Node& node, $name & rhs) {
      $decoders
      return true;
    }
  };
    """
)

all_code = ""

for [k,v] in mappings.items():
    encoders = []
    decoders = []
    # print(f"mapping: {k}")
    # print(f"\tprops:")
    for [prop_name,prop] in v.props.items():
        c_prop_name = prop_name[0].lower() + prop_name[1:]
        match prop.data_type:
            case DataType.integer:
                prop_data_type_name = "std::int32_t"
            case DataType.boolean:
                prop_data_type_name = "bool"
            case DataType.float:
                prop_data_type_name = "float"
            case DataType.string:
                prop_data_type_name = "std::string"
            case DataType.list:
                prop_data_type_name = f"std::vector<{prop_name}>"
            case DataType.object:
                prop_data_type_name = prop.index_data_mapping.name
            case _:
                prop_data_type_name = "std::string"
        encoders.append(f"node[\"{prop_name}\"] = rhs.{c_prop_name};")
        decoders.append(f"rhs.{c_prop_name} = node[\"{prop_name}\"].as<{prop_data_type_name}>();")
        # index_data_mapping = prop.index_data_mapping.name if prop.index_data_mapping else "none"
        # print(f"\t\t{name}: {prop.data_type},{prop.index_data_type},{index_data_mapping}")
    values = {"name": k, "encoders": "\n".join(encoders), "decoders": "\n".join(decoders)}
    all_code += convert_template.substitute(values)

out_file = os.path.abspath("coverters.h")
print(f"Writing to {out_file}")
with open(out_file, "w") as f:
    f.write(all_code)

# print(all_code)
# for [k,v] in data["WeekendInfo"].items():
#
#     print(f"Key: {k} Type: {type(v)}")
