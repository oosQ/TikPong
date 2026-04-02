package user

import (
	"social-network/src/app/user/auth"
	"social-network/src/app/user/block"
	"social-network/src/app/user/core"
	"social-network/src/app/user/follow"
)

func Init() {
	core.Init()
	block.Init()
	follow.Init()
	auth.Init()
}