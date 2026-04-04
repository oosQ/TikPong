package group

import (
	"social-network/src/app/group/core"
	"social-network/src/app/group/membership"
	"social-network/src/app/group/join-requests"
	"social-network/src/app/group/invitations"
    "social-network/src/app/group/posts"
	"social-network/src/app/group/events"

)

func Init() {
    core.Init() 
	membership.Init()
	joinrequests.Init()
	invitations.Init()
    posts.Init()
    events.Init()
}
