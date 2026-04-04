package posts

import (
	"social-network/src/app/group/posts/comments"
	"social-network/src/app/group/posts/core"
	"social-network/src/app/group/posts/likes"
)

func Init() {
	core.Init()
	comments.Init()
	likes.Init()
}
