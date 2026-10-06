# ============================================================
# BookNest Backend - Render Production Dockerfile
# ============================================================

# Step 1: Build stage using JDK 17
FROM eclipse-temurin:17-jdk-jammy AS build
WORKDIR /app

# Copy backend source, libraries, and SQL scripts
COPY backend /app/backend

# Compile all Java sources into classes
RUN mkdir -p /app/backend/target/classes && \
    javac -cp "/app/backend/lib/*" -d /app/backend/target/classes $(find /app/backend/src/main/java -name "*.java")

# Step 2: Lightweight runtime stage using JRE 17
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app

# Copy compiled classes and dependencies
COPY --from=build /app/backend/target/classes /app/target/classes
COPY --from=build /app/backend/lib /app/lib
COPY --from=build /app/backend/sql /app/backend/sql

# Default port (Render automatically overrides this with $PORT)
ENV PORT=8080
EXPOSE 8080

# Run BookNest AppServer
CMD ["sh", "-c", "java -cp /app/target/classes:/app/lib/* com.booknest.AppServer"]
