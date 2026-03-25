package models

type Follow struct {
	FollowerID string `db:"follower_id"`
	FolloweeID string `db:"followee_id"`
	CreatedAt  string `db:"created_at"`
}

type FollowRequest struct {
	RequesterID string `db:"requester_id"`
	TargetID    string `db:"target_id"`
	Status      string `db:"status"` 
	CreatedAt   string `db:"created_at"`
	UpdatedAt   string `db:"updated_at"`
}

