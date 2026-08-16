# Use official Nginx Alpine image
FROM nginx:alpine

# Copy the static files into the Nginx html directory
COPY . /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Command to run nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
