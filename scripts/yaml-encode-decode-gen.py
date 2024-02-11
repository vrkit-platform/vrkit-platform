import json
from enum import Enum

import yaml

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

class Prop:
    def __init__(self, name: str, data_type: DataType, index_data_type: DataType = DataType.unknown):
        self.name = name
        self.dataType = data_type

class Mapping:
    def __init__(self, name:str, props=None):
        if props is None:
            props = []

        self.name = name
        self.props = props


def make_prop_from(mappings: dict[str, Mapping], key, value):
    index_data_type = DataType.unknown
    match type(value):
        case str():
            data_type = DataType.string
        case bool():
            data_type = DataType.boolean
        case float():
            data_type = DataType.float
        case int():
            data_type = DataType.integer
        case list():
            data_type = DataType.list
            index_data_type = DataType.string
            # TODO: implement get_data_type, which if a dict and a matching member set is found
            # if len(value):


        case _:
            data_type = DataType.unknown

    return Prop(key, data_type, index_data_type)

def visit(mapping: Mapping, node: dict, mappings: dict[str, Mapping]):
    """
    First prints the final entry in the dictionary (most nested) and its key
    Then prints the keys leading into this
    * could be reversed to be more useful, I guess
    """
    for key,value in node.items():
        if isinstance(value, dict):
            visit(mapping, value, mappings)
        else:
            print(f"{key}: {type(value)}")
            mapping.props[key] = make_prop_from(mappings, key, value)


mapping = Mapping(name="SessionInfoMessage")
mappings = { mapping.name: mapping }
visit(mapping, data, mappings)
# for [k,v] in data["WeekendInfo"].items():
#
#     print(f"Key: {k} Type: {type(v)}")
