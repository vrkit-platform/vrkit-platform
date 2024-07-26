import sys
import os

models_path = os.path.dirname(os.path.realpath(__file__))
print(f"Models path = {models_path}")
sys.path.append(models_path)

from .LapTrajectory_pb2 import *
from .TrackMap_pb2 import *
from .TrackMapFile_pb2 import *
from .FileInfo_pb2 import *
