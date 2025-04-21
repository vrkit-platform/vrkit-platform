# `IPCDataServerService` Design

## Todo

- Events
  - Add connection event `publish` emit code for all events
- Connection Management
  - Track connections
- Request/Response Messages
  - `IsConnected`
  - `GetVariableHeaders`
  - `GetSessionInfo`
  - `Subscribe(DATA_FRAME|SESSION_INFO)`

```plantuml
@startuml
participant NodeJSClient as Client
participant IPCDataServerService as Server 
Client -> Server: <<connect>>
activate Server
Server->Server: <<register-client>>
Server->Client: <<client-connection-id>>
deactivate Server
|||
Client->Server: <<subscribe>>
note right: Events include \n\
session_changed\n\
session_data_frame\n\
session_metadata_changed
activate Server
Server->Client: <<subscribe_confirm>>
deactivate Server
||| 
Server->Client: <<session_changed>>
note right: When a new session is connected, this is triggered

activate Client
Client->Server: <<get_data_var_headers>>
activate Server
Server->Client: <<data_var_headers>>
deactivate Server

Client->Server: <<subscribe_data_vars>>
note right: Pass the indexes of the data headers\n\
that the client wants to receive via\n\
session_data_frame event
activate Server
Server->Client: <<subscribe_confirm>>
deactivate Server
deactivate Client

@enduml
```