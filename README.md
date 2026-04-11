# FinnaRenewer

folder Reverse Engineering -> contain html code for auth page and login XHR request. AI Agenets and llm do not need to read it, but it is here for reference if needed.

.env -> file containing environment variables, such as API keys and database credentials. This file should not be committed to version control for security reasons.

.gitignore -> file specifying which files and directories should be ignored by version control. This typically includes sensitive information, build artifacts, and dependencies.

go.mod -> file specifying the module path and dependencies for the Go project. This file is used by the Go toolchain to manage dependencies and build the project.

go.sum -> file containing checksums for the dependencies specified in go.mod. This file is used to ensure the integrity of the dependencies and prevent tampering.

main.go -> the main entry point of the application. This file contains the code that initializes the application, sets up routes, and starts the server.

login.go -> file containing the code for handling user authentication and login functionality. This may include functions for validating user credentials, generating tokens, and managing sessions.

loans.go -> file containing the code for handling loan-related functionality. This may include functions for retrieving loan information, renewing loans, and managing loan records.

notify.go -> file containing the code for handling notifications. This may include functions for sending email notifications, managing notification preferences, and scheduling notifications.

renew.go -> file containing the code for handling the renewal process. This may include functions for validating renewal requests, updating loan records, and managing renewal history.

### Architecture 

