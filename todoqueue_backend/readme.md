# **TodoQueue API Backend Documentation**

## **Base URL**
All API requests are made to: `/api/`

## **Endpoints**

### **1. Create Task**

- **URL:** `/tasks/`
- **Method:** `POST`
- **Payload:**

  ```json
  {
    "task_name": "Sample Task",
    "task_id": "001",
    "brownie_point_value": 5,
    "max_interval": 10,
    "min_interval": 3,
    "priority": 1,
    "description": "Description of the sample task."
  }
  ```

- **Success Response:**  
  **Code:** `201 CREATED`  
  **Content:** Newly created task object

- **Error Responses:**  
  If a required field is missing or any other validation fails:  
  **Code:** `400 BAD REQUEST`

### **2. Delete Task**

- **URL:** `/tasks/delete_task/`
- **Method:** `POST`
- **Payload:**

  ```json
  {
    "task_id": "001"
  }
  ```

- **Success Response:**  
  **Code:** `200 OK`  
  **Content:** `{"message": "Task deleted successfully"}`

- **Error Responses:**  
  If the task with the given ID does not exist:  
  **Code:** `404 NOT FOUND`  
  **Content:** `{"error": "Task does not exist"}`

### **3. Task Done**

- **URL:** `/tasks/task_done/`
- **Method:** `POST`
- **Payload:**

  ```json
  {
    "task_id": "001",
    "username": "test_user"
  }
  ```

- **Success Response:**  
  **Code:** `200 OK`  
  **Content:** `{"message": "Task completed by test_user"}`

- **Error Responses:**  
  If the task with the given ID does not exist:  
  **Code:** `404 NOT FOUND`  
  **Content:** `{"error": "Task does not exist"}`

### **4. List Tasks**

- **URL:** `/tasks/`
- **Method:** `GET`
- **Success Response:**  
  **Code:** `200 OK`  
  **Content:** List of task objects

---

## **Status Codes**

The API returns the following status codes:

- `200 OK`: The request was successful.
- `201 CREATED`: The request was successful, and a resource was created.
- `400 BAD REQUEST`: There was a problem with the request (e.g., missing required parameters).
- `404 NOT FOUND`: The requested resource could not be found.
- `500 INTERNAL SERVER ERROR`: A server error occurred.

---

**Note:** Be sure to replace `yourdomain.com` with your actual domain or IP address. If you use tools like Swagger or DRF's built-in browsable API, you can generate interactive documentation, which is even more user-friendly.