package repository

// AddPerformanceIndexes adds database indexes to improve query performance
func (r *Repository) AddPerformanceIndexes() error {
	// Add indexes for commonly queried fields
	queries := []string{
		// Index on users.email (already has uniqueIndex, but let's ensure it's optimized)
		"CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email_active ON users(email) WHERE deleted_at IS NULL;",
		
		// Index on users.user_type for faster filtering
		"CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_user_type ON users(user_type);",
		
		// Index on users.status for filtering active users
		"CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_status ON users(status);",
		
		// Composite index for email lookup with soft delete check
		"CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email_deleted ON users(email, deleted_at);",
		
		// Index on student_profiles.user_id for joins
		"CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_student_profiles_user_id ON student_profiles(user_id);",
		
		// Index on instructor_profiles.user_id for joins  
		"CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_instructor_profiles_user_id ON instructor_profiles(user_id);",
		
		// Index on institute_admin_profiles.user_id for joins
		"CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_institute_admin_profiles_user_id ON institute_admin_profiles(user_id);",
		
		// Index on institute_admin_profiles.institute_id for lookups
		"CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_institute_admin_profiles_institute_id ON institute_admin_profiles(institute_id);",
	}
	
	for _, query := range queries {
		if err := r.db.Exec(query).Error; err != nil {
			// Log the error but continue with other indexes
			// In production, you might want to handle this differently
			continue
		}
	}
	
	return nil
}