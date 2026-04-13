.PHONY: help up down build logs seed simulate ps clean

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

up: ## Start all services (production mode)
	docker-compose up -d --build
	@echo "\n✅ System is up!"
	@echo "   Frontend:  http://localhost:3000"
	@echo "   Backend:   http://localhost:3001"
	@echo "   Health:    http://localhost:3001/health"

down: ## Stop all services
	docker-compose down

build: ## Build all Docker images
	docker-compose build --no-cache

logs: ## Tail logs from all services
	docker-compose logs -f

logs-backend: ## Tail backend logs only
	docker-compose logs -f backend

logs-worker: ## Tail worker logs only
	docker-compose logs -f worker

seed: ## Create default admin/dev users in MongoDB
	docker-compose exec backend node dist/utils/seed.js

simulate: ## Run multi-service log simulator
	docker-compose exec backend node dist/utils/simulator.js

scale-workers: ## Scale workers to 3 instances
	docker-compose up -d --scale worker=3

ps: ## Show running containers
	docker-compose ps

clean: ## Remove containers, volumes, images
	docker-compose down -v --rmi local
	@echo "🗑️  Cleaned up all resources"

dev: ## Start in development mode (hot reload)
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build
