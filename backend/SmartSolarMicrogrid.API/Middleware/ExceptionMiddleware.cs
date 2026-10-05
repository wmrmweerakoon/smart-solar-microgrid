/* 
 * ==============================================================================
 * Smart Solar Microgrid Trading & Energy Management System
 * System Module Documentation
 * ==============================================================================
 */
using System.Net;
using System.Text.Json;

namespace SmartSolarMicrogrid.API.Middleware
{
    /// <summary>
    /// Global exception handling middleware.
    /// Catches unhandled exceptions and returns consistent JSON error responses.
    /// </summary>
    public class ExceptionMiddleware
    {
        // Reference to the next middleware in the pipeline
        private readonly RequestDelegate _next;
        // Logger service to record exception details
        private readonly ILogger<ExceptionMiddleware> _logger;

        public ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        // Intercepts the HTTP request to catch exceptions globally
        public async Task InvokeAsync(HttpContext context)
        {
            // Executes the InvokeAsync operation flow
            try
            {
                // Pass the request to the next middleware
                await _next(context);
            }
            catch (InvalidOperationException ex)
            {
                // Handle business logic validation errors as 400 Bad Request
                _logger.LogWarning(ex, "Validation error occurred");
                await HandleExceptionAsync(context, ex, HttpStatusCode.BadRequest);
            }
            catch (UnauthorizedAccessException ex)
            {
                // Handle unauthorized access attempts as 401 Unauthorized
                _logger.LogWarning(ex, "Unauthorized access attempt");
                await HandleExceptionAsync(context, ex, HttpStatusCode.Unauthorized);
            }
            catch (KeyNotFoundException ex)
            {
                // Handle missing resources (like not found bookings) as 404 Not Found
                _logger.LogWarning(ex, "Resource not found");
                await HandleExceptionAsync(context, ex, HttpStatusCode.NotFound);
            }
            catch (Exception ex)
            {
                // Catch all other unexpected errors as 500 Internal Server Error
                _logger.LogError(ex, "An unexpected error occurred");
                await HandleExceptionAsync(context, ex, HttpStatusCode.InternalServerError);
            }
        }

        // Helper method to format and write the JSON error response
        private static async Task HandleExceptionAsync(HttpContext context, Exception exception, HttpStatusCode statusCode)
        {
            // Set the content type to JSON
            context.Response.ContentType = "application/json";
            // Set the HTTP status code
            context.Response.StatusCode = (int)statusCode;

            // Create a standardized error response object
            var response = new
            {
                statusCode = (int)statusCode,
                message = exception.Message,
                timestamp = DateTime.UtcNow
            };

            // Configure JSON serialization to use camelCase (standard for web APIs)
            var jsonOptions = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
            
            // Write the serialized JSON string to the HTTP response body
            await context.Response.WriteAsync(JsonSerializer.Serialize(response, jsonOptions));
        }
    }
}

