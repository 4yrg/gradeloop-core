package main

import (
	"context"
	"fmt"
	"log"
	"net"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/4yrg/gradeloop-core/develop/services/go/authz/internal/config"
	authzgrpc "github.com/4yrg/gradeloop-core/develop/services/go/authz/internal/grpc"
	authzhttp "github.com/4yrg/gradeloop-core/develop/services/go/authz/internal/http"
	"github.com/4yrg/gradeloop-core/develop/services/go/authz/internal/models"
	"github.com/4yrg/gradeloop-core/develop/services/go/authz/internal/repository"
	"github.com/4yrg/gradeloop-core/develop/services/go/authz/internal/service"
	authzpb "github.com/4yrg/gradeloop-core/libs/proto/authz"
	"github.com/4yrg/gradeloop-core/libs/security"
	"github.com/redis/go-redis/v9"
	"google.golang.org/grpc"
	"google.golang.org/grpc/reflection"
	"gorm.io/driver/postgres"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	// Database initialization
	var db *gorm.DB
	if cfg.Database.Driver == "sqlite" {
		db, err = gorm.Open(sqlite.Open(cfg.GetDSN()), &gorm.Config{})
	} else {
		db, err = gorm.Open(postgres.Open(cfg.GetDSN()), &gorm.Config{})
	}
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// Auto migrations
	err = db.AutoMigrate(&models.Role{}, &models.Permission{}, &models.Policy{}, &models.AuditLog{})
	if err != nil {
		log.Fatalf("Failed to migrate database: %v", err)
	}

	// Redis initialization
	rdb := redis.NewClient(&redis.Options{
		Addr:     fmt.Sprintf("%s:%d", cfg.Redis.Host, cfg.Redis.Port),
		Password: cfg.Redis.Password,
		DB:       cfg.Redis.DB,
	})

	// Repositories
	policyRepo := repository.NewPolicyRepository(db, rdb)
	roleRepo := repository.NewRoleRepository(db)
	permissionRepo := repository.NewPermissionRepository(db)
	auditRepo := repository.NewAuditRepository(db)

	// Services
	authzSvc := service.NewAuthzService(policyRepo, roleRepo, permissionRepo, auditRepo)

	// Token Service
	privKey, err := security.LoadPrivateKeyFromFile(cfg.Auth.PrivateKeyPath)
	if err != nil {
		log.Fatalf("Failed to load private key: %v", err)
	}
	signer := security.NewTokenSigner(privKey, "authz-service")
	tokenSvc := service.NewTokenService(signer, cfg)

	// gRPC Server
	lis, err := net.Listen("tcp", ":"+cfg.Server.GrpcPort)
	if err != nil {
		log.Fatalf("Failed to listen on gRPC port: %v", err)
	}

	grpcServer := grpc.NewServer()
	authzHandler := authzgrpc.NewAuthzHandler(authzSvc, tokenSvc)
	authzpb.RegisterAuthorizationServiceServer(grpcServer, authzHandler)
	reflection.Register(grpcServer)

	// HTTP Admin Server
	adminHandler := authzhttp.NewAdminHandler(policyRepo, roleRepo)
	httpServer := &http.Server{
		Addr:    ":" + cfg.Server.Port,
		Handler: adminHandler.Routes(),
	}

	// Graceful shutdown
	go func() {
		fmt.Printf("gRPC server listening on %s\n", cfg.Server.GrpcPort)
		if err := grpcServer.Serve(lis); err != nil {
			log.Fatalf("gRPC server failed: %v", err)
		}
	}()

	go func() {
		fmt.Printf("HTTP Admin API listening on %s\n", cfg.Server.Port)
		if err := httpServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("HTTP server failed: %v", err)
		}
	}()

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)
	<-stop

	fmt.Println("Shutting down servers...")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	grpcServer.GracefulStop()
	httpServer.Shutdown(ctx)
	fmt.Println("Servers stopped.")
}
