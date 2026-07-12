package post

import (
	"social-network/src/app/post/comment"
	"social-network/src/app/post/core"
	"social-network/src/app/post/hashtag"
	"social-network/src/app/post/like"
	"social-network/src/app/post/repost"
	"social-network/src/app/post/view"
)

func Init() {
	core.Init()
	like.Init()
	repost.Init()
	comment.Init()
	view.Init()
	hashtag.Init()
}
