package post

import (
	"social-network/src/app/post/comment"
	"social-network/src/app/post/core"
	"social-network/src/app/post/like"
	"social-network/src/app/post/view"
	"social-network/src/app/post/hashtag"
)

func Init() {
	core.Init()
	like.Init()
	comment.Init()
	view.Init()
	hashtag.Init()
}