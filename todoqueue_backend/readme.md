# Task & WorkLog API Documentation

## Task

### 1. List All Tasks

- **Endpoint**: `/api/tasks/`
- **Method**: `GET`
  
### 2. Create a New Task

- **Endpoint**: `/api/tasks/`
- **Method**: `POST`
- **Payload**:
  ```json
  {
    "task_name": "string",
    "task_id": "string",
    "max_interval": "string",
    "min_interval": "string",
    "description": "string",
    "last_completed": "datetime"
  }
  ```

### 3. Retrieve a Task

- **Endpoint**: `/api/tasks/{task_id}/`
- **Method**: `GET`

### 4. Update a Task

- **Endpoint**: `/api/tasks/{task_id}/`
- **Method**: `PUT`
- **Payload**:
  ```json
  {
    "task_name": "string",
    "max_interval": "string",
    "min_interval": "string",
    "description": "string",
    "last_completed": "datetime"
  }
  ```

### 5. Delete a Task

- **Endpoint**: `/api/tasks/{task_id}/`
- **Method**: `DELETE`

---

## WorkLog

### 1. List All WorkLogs

- **Endpoint**: `/api/worklogs/`
- **Method**: `GET`

### 2. Create a New WorkLog

- **Endpoint**: `/api/worklogs/`
- **Method**: `POST`
- **Payload**:
  ```json
  {
    "task": "task_id",
    "user": "user_id",
    "timestamp": "string",
    "grossness": "float",
    "brownie_points": "integer",
    "completion_time": "string"
  }
  ```

### 3. Retrieve a WorkLog

- **Endpoint**: `/api/worklogs/{worklog_id}/`
- **Method**: `GET`

### 4. Update a WorkLog

- **Endpoint**: `/api/worklogs/{worklog_id}/`
- **Method**: `PUT`
- **Payload**:
  ```json
  {
    "task": "task_id",
    "user": "user_id",
    "timestamp": "string",
    "grossness": "float",
    "brownie_points": "integer",
    "completion_time": "string"
  }
  ```

### 5. Delete a WorkLog

- **Endpoint**: `/api/worklogs/{worklog_id}/`
- **Method**: `DELETE`

---

# Status Codes

- `200 OK`: The request was successful.
- `201 Created`: The resource was successfully created.
- `400 Bad Request`: The request was malformed or invalid.
- `401 Unauthorized`: User is not authenticated.
- `403 Forbidden`: User is authenticated but doesn't have the required permissions.
- `404 Not Found`: The requested resource could not be found.
- `500 Internal Server Error`: An error occurred on the server.

# Pagination

The API supports pagination. To navigate through the list of items, use the pagination controls returned in the API response.
