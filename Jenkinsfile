pipeline {
  agent any

  options {
    skipDefaultCheckout(true)
  }

  environment {
    DOCKERHUB_USER = "preyanshmehta25"
    BACKEND_IMAGE = "${DOCKERHUB_USER}/stackit-backend"
    FRONTEND_IMAGE = "${DOCKERHUB_USER}/stackit-frontend"
    TAG = "${env.BUILD_NUMBER}"
    VITE_API_BASE_URL = "http://localhost:5001"
  }

  stages {
    stage("Checkout") {
      steps {
        deleteDir()
        checkout scm
      }
    }

    stage("Build Images") {
      steps {
        sh """
          docker build -t ${BACKEND_IMAGE}:${TAG} -t ${BACKEND_IMAGE}:latest ./backend
          docker build -t ${FRONTEND_IMAGE}:${TAG} -t ${FRONTEND_IMAGE}:latest \
            --build-arg VITE_API_BASE_URL=${VITE_API_BASE_URL} \
            ./frontend
        """
      }
    }

    stage("Push Images") {
      steps {
        withCredentials([usernamePassword(credentialsId: "dockerhub-creds", usernameVariable: "DOCKER_USER", passwordVariable: "DOCKER_PASS")]) {
          sh """
            echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin
            docker push ${BACKEND_IMAGE}:${TAG}
            docker push ${BACKEND_IMAGE}:latest
            docker push ${FRONTEND_IMAGE}:${TAG}
            docker push ${FRONTEND_IMAGE}:latest
          """
        }
      }
    }

    stage("Deploy") {
      steps {
        sh """
          docker-compose -f docker-compose.yml down --remove-orphans || true
          docker-compose -f docker-compose.yml pull
          docker-compose -f docker-compose.yml up -d --force-recreate
        """
      }
    }
  }

}
