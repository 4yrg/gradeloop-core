package handlers

import (
	"github.com/gofiber/fiber/v2"
	"github.com/gradeloop/api-gateway/services"
)

func CreateInstitute(c *fiber.Ctx) error {
	type Request struct {
		Name string `json:"name"`
		Code string `json:"code"`
	}

	var req Request
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	res, err := services.CreateInstituteGrpc(req.Name, req.Code)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(fiber.StatusCreated).JSON(res.Institute)
}

func AddInstituteAdmin(c *fiber.Ctx) error {
	type Request struct {
		Email string `json:"email"`
		Name  string `json:"name"`
	}

	var req Request
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	instituteID := c.Params("id")

	// 1. Invite User via Auth Service
	inviteRes, err := services.InviteUserGrpc(req.Email, "institute-admin", req.Name)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to invite user: " + err.Error()})
	}

	// 2. Add to Institute via Institute Service
	_, err = services.AddInstituteAdminGrpc(instituteID, inviteRes.UserId)
	if err != nil {
		// TODO: Rollback user creation? Or just fail?
		// Ideally saga pattern, but for MVP just fail.
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to link admin to institute: " + err.Error()})
	}

	// 3. Send Email (Mock or Real)
	// The previous implementation used a reset token. We return it here for now or log it.
	// In production, AuthService or Gateway should have sent the email.
	// Since we returned the token, let's include it in response for testing/manual verification.

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message":     "Institute Admin added successfully",
		"user_id":     inviteRes.UserId,
		"reset_token": inviteRes.ResetToken, // For testing only!
	})
}
