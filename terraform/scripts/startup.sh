#!/bin/bash

set -e

echo "Configuring system parameters..."
sysctl -w vm.max_map_count=262144
sysctl -w fs.file-max=65536
echo "vm.max_map_count=262144" >> /etc/sysctl.conf
echo "Done."

echo "Installing Docker and Docker Compose..."
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
usermod -aG docker "$USER"
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
echo "Done."

echo "Formatting and mounting persistent disk..."
DEVICE_NAME="/dev/disk/by-id/google-sonarqube-data"
MOUNT_POINT="/opt/sonarqube"
mkfs.ext4 -F "$DEVICE_NAME"
mkdir -p "$MOUNT_POINT"
mount "$DEVICE_NAME" "$MOUNT_POINT"
echo "$DEVICE_NAME $MOUNT_POINT ext4 defaults 0 2" >> /etc/fstab
echo "Done."

echo "Getting database password from Secret Manager..."
DB_PASSWORD=$(gcloud secrets versions access latest --secret="${db_password_secret}")
echo "Done."

echo "Creating Docker Compose configuration..."
cat > "$MOUNT_POINT/compose.yml" << EOF
services:
  sonarqube:
    container_name: sonarqube
    image: sonarqube:community
    environment:
      SONAR_JDBC_URL: "jdbc:postgresql://${db_host}:5432/${db_name}"
      SONAR_JDBC_USERNAME: "${db_user}"
      SONAR_JDBC_PASSWORD: "$DB_PASSWORD"
    ports:
      - "9000:9000"
    restart: unless-stopped
    volumes:
      - sonarqube_data:/opt/sonarqube/data
      - sonarqube_extensions:/opt/sonarqube/extensions
      - sonarqube_logs:/opt/sonarqube/logs

volumes:
  sonarqube_data:
  sonarqube_extensions:
  sonarqube_logs:
EOF
echo "Done."

echo "Starting SonarQube..."
cd "$MOUNT_POINT"
docker compose up -d
echo "SonarQube is up and running on port 9000."
