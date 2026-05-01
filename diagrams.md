# CitiVoice Diagrams

Here are the Entity Relationship Diagram (ERD) and Data Flow Diagram (DFD) for the CitiVoice project. 

> [!TIP]
> **How to use this in Figma:**
> 1. In Figma, go to **Plugins** and search for **"Mermaid"** (there are several free ones like *Mermaid to Figma* or *Mermaid Chart*).
> 2. Run the plugin and copy-paste the raw Mermaid code block below into it.
> 3. It will automatically draw the diagrams for you inside Figma as editable vectors!

---

## Entity Relationship Diagram (ERD)

This diagram shows the database structure and how the different tables relate to each other.

```mermaid
erDiagram
    USERS {
        int id PK
        varchar name
        varchar email
        varchar password_hash
        varchar phone
        varchar barangay
        enum role "admin, citizen"
        enum verification_status
        boolean is_verified
        varchar id_type
        varchar id_number
        text id_image_url
    }

    CONCERNS {
        int id PK
        varchar title
        text description
        varchar category
        enum priority
        enum status
        text image_url
        text location_address
        decimal location_lat
        decimal location_lng
        int user_id FK
        text admin_note
        int upvotes
    }

    CONCERN_UPVOTES {
        int id PK
        int concern_id FK
        int user_id FK
    }

    NOTIFICATIONS {
        int id PK
        int user_id FK
        varchar title
        text message
        boolean is_read
    }

    BARANGAYS {
        int id PK
        varchar name
    }

    ANNOUNCEMENTS {
        int id PK
        varchar title
        text body
        enum type
        varchar author
        varchar barangay
    }

    EVENTS {
        int id PK
        varchar title
        text description
        enum category
        datetime date
        varchar location
        varchar organizer
    }

    %% Physical Foreign Key Relationships
    USERS ||--o{ CONCERNS : "submits (user_id)"
    USERS ||--o{ CONCERN_UPVOTES : "creates (user_id)"
    CONCERNS ||--o{ CONCERN_UPVOTES : "receives (concern_id)"
    USERS ||--o{ NOTIFICATIONS : "receives (user_id)"

    %% Logical Relationships (Based on text/varchar fields)
    BARANGAYS ||--o{ USERS : "resides in (barangay)"
    BARANGAYS ||--o{ CONCERNS : "reported in (user_barangay)"
    BARANGAYS ||--o{ ANNOUNCEMENTS : "targeted at (barangay)"
```

---

## Data Flow Diagram (DFD) - Level 0 Context (Gane-Sarson)

This diagram illustrates how information flows between the external entities and the core system using Gane-Sarson conventions (External Entities as squares, Processes as rounded rectangles).

```mermaid
flowchart TD
    %% Gane-Sarson Shapes
    %% External Entities (Squares)
    Citizen[Citizen]
    Admin[City Administrator]

    %% Main System Process (Rounded Rectangle)
    System(0.0 CitiVoice System)

    %% Data Flows: Citizen -> System
    Citizen -- "Civic Reports (Photo, GPS)" --> System
    Citizen -- "Government ID" --> System
    Citizen -- "Upvotes" --> System

    %% Data Flows: System -> Citizen
    System -- "Status Updates" --> Citizen
    System -- "Announcements & Events" --> Citizen
    System -- "Verification Status" --> Citizen

    %% Data Flows: Admin -> System
    Admin -- "Status Updates & Notes" --> System
    Admin -- "Verification Decisions" --> System
    Admin -- "Published Events" --> System
    Admin -- "Barangay Data" --> System

    %% Data Flows: System -> Admin
    System -- "Analytics & Reporting Data" --> Admin
    System -- "Verification Queue" --> Admin
    System -- "Citizen Reports List" --> Admin
```

## Data Flow Diagram (DFD) - Level 1 (Gane-Sarson)

This breaks down the Level 0 process into sub-processes and introduces Data Stores (open-ended rectangles).

```mermaid
flowchart TD
    %% External Entities (Squares)
    Citizen[Citizen]
    Admin[City Administrator]

    %% Processes (Rounded Rectangles)
    P1(1.0 Manage Users & Auth)
    P2(2.0 Process Civic Concerns)
    P3(3.0 Manage Community Events)

    %% Data Stores (Cylinders/Databases represent open-ended rectangles in Mermaid)
    D1[(D1 Users DB)]
    D2[(D2 Concerns DB)]
    D3[(D3 Events DB)]

    %% Citizen Flows
    Citizen -- "ID & Credentials" --> P1
    P1 -- "Verification Status" --> Citizen
    
    Citizen -- "New Concern Details" --> P2
    P2 -- "Concern Updates" --> Citizen
    
    P3 -- "Event Feed" --> Citizen

    %% Admin Flows
    Admin -- "Verification Approvals" --> P1
    P1 -- "Pending Users" --> Admin
    
    Admin -- "Status Updates" --> P2
    P2 -- "Concerns List & Analytics" --> Admin
    
    Admin -- "Event Details" --> P3

    %% Internal Data Store Connections
    P1 <--> D1
    P2 <--> D2
    P3 <--> D3
    
    %% Cross-process Data
    D1 -. "User Profile" .-> P2
```

## Data Flow Diagram (DFD) - Level 2 (Process 2.0 Civic Concerns)

This diagram explodes **Process 2.0 (Process Civic Concerns)** into its detailed sub-processes, showing how concerns are submitted, upvoted, updated, and how notifications are triggered.

```mermaid
flowchart TD
    %% External Entities (Squares)
    Citizen[Citizen]
    Admin[City Administrator]

    %% Level 2 Processes for 2.0 (Rounded Rectangles)
    P21(2.1 Submit New Concern)
    P22(2.2 Review & Update Status)
    P23(2.3 Process Upvotes)
    P24(2.4 Dispatch Notifications)

    %% Data Stores (Open-ended rectangles/Cylinders)
    D1[(D1 Users DB)]
    D2[(D2 Concerns DB)]
    D4[(D4 Upvotes DB)]
    D5[(D5 Notifications DB)]

    %% 2.1 Submit Concern
    Citizen -- "Concern Details (GPS, Photo)" --> P21
    D1 -. "Validate User" .-> P21
    P21 -- "Validated Concern Record" --> D2
    
    %% 2.2 Review & Update
    Admin -- "Status Change & Notes" --> P22
    P22 -- "Update Record" --> D2
    P22 -- "Status Update Trigger" --> P24
    
    %% 2.3 Upvotes
    Citizen -- "Upvote Action" --> P23
    P23 -- "Record Upvote" --> D4
    P23 -- "Increment Count" --> D2
    
    %% 2.4 Notifications
    P24 -- "Create Notification" --> D5
    P24 -- "Push Alert" --> Citizen
```
