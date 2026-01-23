# Bruno API Collection Setup Guide

## Prerequisites

1. **Bruno API Client** - Download and install from [https://www.usebruno.com/downloads](https://www.usebruno.com/downloads)
2. **Identity Service** - The service must be running locally or accessible

## Installation Steps

### Step 1: Install Bruno

**macOS:**
```bash
brew install bruno
```

**Windows:**
Download the installer from [https://www.usebruno.com/downloads](https://www.usebruno.com/downloads)

**Linux:**
```bash
# Using snap
sudo snap install bruno

# Or download the AppImage/deb from the website
```

### Step 2: Open the Collection

1. Launch Bruno
2. Click on **"Open Collection"** or use `Cmd/Ctrl + O`
3. Navigate to the `identity-api-collection` directory
4. Click **"Select Folder"**

The collection will load with all 41 endpoints organized in folders.

### Step 3: Start the Identity Service

**Option A: Using Make**
```bash
cd identity
make run
```

**Option B: Using Docker**
```bash
cd identity
docker-compose up
```

**Option C: Direct Go**
```bash
cd identity
go run cmd/server/main.go
```

The service should be running at `http://localhost:8080`

### Step 4: Select Environment

1. In Bruno, look for the environment dropdown (top-right corner)
2. Select **"Local"**
3. Verify the environment variables:
   - `base_url`: `http://localhost:8080`
   - `api_version`: `v1`

### Step 5: Test the Connection

1. Open the **Health** folder
2. Click on **"Health Check"**
3. Click the **"Send"** button (or press `Cmd/Ctrl + Enter`)
4. You should receive a `200 OK` response with body: `OK`

✅ If successful, you're ready to use the API!

## Quick Test Workflow

Try this sequence to verify everything works:

### 1. Create an Institute
- Folder: **Institutes**
- Request: **Create Institute**
- Click Send
- **Note the ID** from the response (e.g., `"id": 1`)

### 2. Create a Faculty
- Folder: **Faculties**
- Request: **Create Faculty**
- Update `institute_id` in the request body to match the ID from step 1
- Click Send
- **Note the ID** from the response

### 3. Create a Student
- Folder: **Users**
- Request: **Create Student**
- Click Send
- **Note the ID** from the response

### 4. Get All Users
- Folder: **Users**
- Request: **Get All Users**
- Click Send
- You should see your student in the list

## Creating Custom Environments

To add a production or staging environment:

1. Right-click on **environments** folder
2. Select **New Environment**
3. Name it (e.g., "Production")
4. Add variables:
```
vars {
  base_url: https://api.production.com
  api_version: v1
}
```
5. Save the file

## Tips & Tricks

### 1. Keyboard Shortcuts
- `Cmd/Ctrl + Enter` - Send request
- `Cmd/Ctrl + K` - Search requests
- `Cmd/Ctrl + B` - Toggle sidebar
- `Cmd/Ctrl + E` - Switch environment

### 2. Using Variables in Requests
You can reference environment variables using double curly braces:
```
{{base_url}}/api/{{api_version}}/users
```

### 3. Viewing Response Data
- **Body tab** - See the JSON response
- **Headers tab** - View response headers
- **Timeline tab** - Check request timing
- **Tests tab** - Run assertions (if configured)

### 4. Path Parameters
For requests with IDs (e.g., `/users/1`), simply edit the number in the URL:
```
{{base_url}}/api/{{api_version}}/users/123
```

### 5. Query Parameters
For paginated endpoints, modify the query params:
```
?limit=20&offset=40
```

Or use the **Params** tab in Bruno to add/edit them visually.

## Troubleshooting

### Cannot Connect to Service

**Problem:** `ECONNREFUSED` or connection timeout

**Solutions:**
- Verify the service is running: `curl http://localhost:8080/health`
- Check if port 8080 is in use: `lsof -i :8080` (macOS/Linux)
- Verify `base_url` in environment matches your service URL
- Check firewall settings

### 404 Not Found

**Problem:** Endpoint returns 404

**Solutions:**
- Verify the resource exists (e.g., don't try to get user ID 999 if it doesn't exist)
- Check you've selected the correct environment
- Ensure parent resources exist (e.g., institute before faculty)

### Validation Errors

**Problem:** 400 Bad Request with validation error

**Solutions:**
- Check the **Docs** tab for required fields
- Ensure JSON body is valid (no trailing commas, proper quotes)
- Verify field types (strings vs numbers)
- Check that referenced IDs exist (e.g., `institute_id` in Create Faculty)

### Empty Response

**Problem:** Request succeeds but returns empty data

**Solutions:**
- Check pagination parameters (maybe you're on page 100 with only 10 records)
- Verify filters if any
- Ensure you're querying the right resource

## Advanced Usage

### Creating Test Scripts

Bruno supports test scripts. Add to any request:

```javascript
test("Status code is 200", function() {
  expect(res.status).to.equal(200);
});

test("Response has data", function() {
  expect(res.body.data).to.be.an('object');
});
```

### Environment-Specific Scripts

You can add pre-request and post-request scripts at the collection or folder level.

### Sharing the Collection

Since Bruno stores collections as plain files:

1. Commit the `identity-api-collection` folder to git
2. Push to your repository
3. Team members clone and open in Bruno
4. Everyone has the same collection!

## Next Steps

- Read the [README.md](./README.md) for detailed endpoint documentation
- Check [API_EXAMPLES.md](../API_EXAMPLES.md) for curl examples
- Review [QUICKSTART.md](../QUICKSTART.md) for service setup

## Support

- **Bruno Documentation:** [https://docs.usebruno.com/](https://docs.usebruno.com/)
- **Bruno GitHub:** [https://github.com/usebruno/bruno](https://github.com/usebruno/bruno)
- **Issues:** Open an issue in the GradeLoop repository

## Collection Statistics

- **Total Endpoints:** 41
- **Folders:** 8 (Health, Users, Institutes, Faculties, Departments, Classes, Memberships, Roles)
- **Environments:** 1 (Local - customizable)
- **Complete CRUD:** Yes, for all major resources
- **Documentation:** Inline docs for every endpoint

---

**Happy Testing! 🚀**