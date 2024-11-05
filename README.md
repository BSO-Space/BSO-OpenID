## Purpose

**BSO-OpenID** is an authentication service that provides centralized, secure, and flexible user authentication using OpenID Connect and OAuth2 standards. Designed for applications that require secure access management, this service supports multi-provider OAuth2 authentication (e.g., Discord, GitHub) and generates JWT-based access and refresh tokens for session management.

The main objectives of **BSO-OpenID** are

* **Streamlined Authentication** Simplifies the authentication process by offering a centralized service for handling user login via multiple OAuth2 providers.
* **Secure Token-Based Access** Utilizes RSA encryption to securely generate and verify JWT tokens for access and refresh functionality.
* **Role and Permission Management** Manages user roles, permissions, and service-specific access levels, ensuring that only authorized users can access certain resources.
* **Audit Logging** Logs user actions, providing a detailed history of authentication events and access attempts for security and compliance purposes.

**BSO-OpenID** is intended to be easily integrable with various applications, allowing them to offload authentication and authorization logic to this dedicated service. This approach enhances security, simplifies development, and improves overall maintainability for applications requiring user management
