import React, { useState, useEffect, useRef } from "react";
import { db } from "../../firebase";
import { getAuth } from "firebase/auth";
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  doc,
  updateDoc,
  arrayUnion,
  deleteDoc,
  getDoc,
} from "firebase/firestore";
import { Editor } from "@tinymce/tinymce-react";
import { toast } from "react-toastify";
import "prismjs/themes/prism.css";
import {
  BiUpvote,
  BiSolidUpvote,
  BiComment,
  BiTime,
  BiUser,
  BiMessageSquareDetail,
  BiPlus,
  BiFilter,
  BiSearch,
  BiChevronDown,
  BiChevronUp,
  BiDotsHorizontal,
  BiCheck,
  BiTrash,
  BiEdit,
} from "react-icons/bi";
import {
  HiOutlineQuestionMarkCircle,
  HiOutlineSpeakerphone,
  HiOutlineUserCircle,
} from "react-icons/hi";

const Discussion = () => {
  const [posts, setPosts] = useState([]);
  const [formType, setFormType] = useState("question");
  const [content, setContent] = useState("");
  const [replyContent, setReplyContent] = useState("");
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [isAdminView, setIsAdminView] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const auth = getAuth();
  const user = auth.currentUser;
  const userId = user.uid;
  const admins = ["sc922055@student.nitw.ac.in", "rk972006@student.nitw.ac.in"];
  const [visibleReplies, setVisibleReplies] = useState({});
  const [replyFormVisible, setReplyFormVisible] = useState({});
  const editorRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      const q = query(collection(db, "posts"), orderBy("timestamp", "desc"));
      const querySnapshot = await getDocs(q);
      setPosts(
        querySnapshot.docs?.map((doc) => ({ id: doc.id, data: doc.data() }))
      );
    };

    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newPost = {
      type: formType,
      content: editorRef.current.getContent(),
      upvotes: 0,
      timestamp: new Date(),
      replies: [],
      upvotedBy: [],
      createdBy: user.displayName,
      approved: admins.includes(user.email),
      approvedBy: admins.includes(user.email) ? user.email : null,
    };

    const docRef = await addDoc(collection(db, "posts"), newPost);

    setPosts((prevPosts) => [{ id: docRef.id, data: newPost }, ...prevPosts]);
    setContent("");
    setShowCreateForm(false);

    if (!admins.includes(user.email)) {
      toast.info("Your post will be visible after admin approval");
    } else {
      toast.success("Post published successfully!");
    }
  };

  const handleReply = async (e) => {
    e.preventDefault();

    const postRef = doc(db, "posts", currentQuestion);
    const newReply = {
      content: editorRef.current.getContent(),
      upvotes: 0,
      timestamp: new Date(),
      upvotedBy: [],
      createdBy: user.displayName,
      approved: admins.includes(user.email),
      approvedBy: admins.includes(user.email) ? user.email : null,
    };

    await updateDoc(postRef, {
      replies: arrayUnion(newReply),
    });

    const postIndex = posts.findIndex((p) => p.id === currentQuestion);
    posts[postIndex].data.replies.push(newReply);
    setPosts([...posts]);

    setReplyContent("");
    setReplyFormVisible((prev) => ({ ...prev, [currentQuestion]: false }));

    if (!admins.includes(user.email)) {
      toast.info("Your reply will be visible after admin approval");
    } else {
      toast.success("Reply posted successfully!");
    }
  };

  const handleUpvote = async (postId, isReply, replyIndex) => {
    const postRef = doc(db, "posts", postId);
    const post = await (await getDoc(postRef)).data();

    let newPosts = [...posts];

    if (isReply) {
      const replies = post.replies;
      if (
        Array.isArray(replies[replyIndex].upvotedBy) &&
        replies[replyIndex].upvotedBy.includes(userId)
      ) {
        replies[replyIndex].upvotes -= 1;
        replies[replyIndex].upvotedBy = replies[replyIndex].upvotedBy.filter(
          (id) => id !== userId
        );
      } else {
        replies[replyIndex].upvotes += 1;
        replies[replyIndex].upvotedBy.push(userId);
      }

      await updateDoc(postRef, { replies });

      const postIndex = newPosts.findIndex((p) => p.id === postId);
      newPosts[postIndex].data.replies = replies;
    } else {
      if (Array.isArray(post.upvotedBy) && post.upvotedBy.includes(userId)) {
        post.upvotes -= 1;
        post.upvotedBy = post.upvotedBy.filter((id) => id !== userId);
      } else {
        post.upvotes += 1;
        post.upvotedBy.push(userId);
      }

      await updateDoc(postRef, {
        upvotes: post.upvotes,
        upvotedBy: post.upvotedBy,
      });

      const postIndex = newPosts.findIndex((p) => p.id === postId);
      newPosts[postIndex].data = post;
    }

    setPosts(newPosts);
  };

  const handleApprove = async (postId) => {
    const postRef = doc(db, "posts", postId);
    await updateDoc(postRef, {
      approved: true,
      approvedBy: user.email,
    });

    const postIndex = posts.findIndex((p) => p.id === postId);
    posts[postIndex].data.approved = true;
    posts[postIndex].data.approvedBy = user.email;
    setPosts([...posts]);
  };

  const handleApproveReply = async (postId, replyIndex) => {
    const postRef = doc(db, "posts", postId);
    const post = await (await getDoc(postRef)).data();

    post.replies[replyIndex].approved = true;
    post.replies[replyIndex].approvedBy = user.email;

    await updateDoc(postRef, { replies: post.replies });

    const postIndex = posts.findIndex((p) => p.id === postId);
    posts[postIndex].data.replies = post.replies;
    setPosts([...posts]);
  };

  const handleDeleteReply = async (postId, replyIndex) => {
    const postRef = doc(db, "posts", postId);
    const post = await (await getDoc(postRef)).data();

    post.replies.splice(replyIndex, 1);

    await updateDoc(postRef, { replies: post.replies });

    const postIndex = posts.findIndex((p) => p.id === postId);
    posts[postIndex].data.replies = post.replies;
    setPosts([...posts]);
  };

  const handleDelete = async (postId) => {
    if (window.confirm("Are you sure you want to delete this post?")) {
      const postRef = doc(db, "posts", postId);
      await deleteDoc(postRef);

      setPosts(posts.filter((p) => p.id !== postId));
      toast.success("Post deleted successfully");
    }
  };

  const toggleReplies = (postId) => {
    setVisibleReplies((prevState) => ({
      ...prevState,
      [postId]: !prevState[postId],
    }));
  };

  const toggleReplyForm = (postId) => {
    setCurrentQuestion(postId);
    setReplyFormVisible((prevState) => ({
      ...prevState,
      [postId]: !prevState[postId],
    }));
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const time = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));

    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const filteredPosts = posts
    .filter((post) => post.data.approvedBy || admins.includes(user.email))
    .filter((post) => {
      const matchesSearch =
        post.data.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.data.createdBy.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter =
        filterType === "all" || post.data.type === filterType;
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      if (sortBy === "newest") return b.data.timestamp - a.data.timestamp;
      if (sortBy === "oldest") return a.data.timestamp - b.data.timestamp;
      if (sortBy === "popular") return b.data.upvotes - a.data.upvotes;
      return 0;
    });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Discussion Forum
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Share knowledge, ask questions, and connect with the community
              </p>
            </div>

            {admins.includes(user.email) && (
              <div className="flex items-center space-x-3 mt-4 sm:mt-0">
                <button
                  onClick={() => setIsAdminView(!isAdminView)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isAdminView
                      ? "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
                      : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  {isAdminView ? "Exit Admin" : "Admin View"}
                </button>
              </div>
            )}
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <BiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg" />
              <input
                type="text"
                placeholder="Search discussions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-white placeholder-gray-500"
              />
            </div>

            <div className="flex gap-2">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-white"
              >
                <option value="all">All Posts</option>
                <option value="question">Questions</option>
                <option value="post">Announcements</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-white"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="popular">Most Popular</option>
              </select>
            </div>
          </div>

          {/* Create Post Button */}
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <BiPlus className="text-lg" />
            Create New Post
          </button>
        </div>

        {/* Create Post Form */}
        {showCreateForm && (
          <div className="mb-8 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-600 overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-slate-600">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Create New Post
              </h3>

              <select
                value={formType}
                onChange={(e) => setFormType(e.target.value)}
                className="w-full sm:w-auto px-4 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-white mb-4"
              >
                <option value="question">🤔 Ask a Question</option>
                {admins.includes(user.email) && (
                  <option value="post">📢 Make an Announcement</option>
                )}
              </select>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="mb-4">
                <Editor
                  onInit={(evt, editor) => (editorRef.current = editor)}
                  apiKey="bmcdss687jwqtyt2iwkph4vn5b0epn6f4wc420ezudzsnvff"
                  init={{
                    height: 300,
                    menubar: false,
                    plugins:
                      "anchor autolink charmap codesample emoticons image link lists media searchreplace table visualblocks wordcount codesample quote",
                    toolbar:
                      "undo redo | blocks fontfamily fontsize | bold italic underline strikethrough forecolor backcolor | link image media table | align lineheight | numlist bullist indent outdent | emoticons charmap | removeformat | codesample quote",
                    skin: document.documentElement.classList.contains("dark")
                      ? "oxide-dark"
                      : "oxide",
                    content_css: document.documentElement.classList.contains(
                      "dark"
                    )
                      ? "dark"
                      : "default",
                  }}
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200"
                >
                  Publish Post
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-6 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-slate-600 dark:hover:bg-slate-500 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors duration-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Posts */}
        <div className="space-y-6 w-full">
          {filteredPosts.map((post) => (
            <div
              key={post.id}
              className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-600 overflow-hidden hover:shadow-xl transition-all duration-200 w-full"
            >
              {/* Post Header */}
              <div className="p-8 border-b border-gray-100 dark:border-slate-600">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {post.data.type === "question" ? (
                      <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                        <HiOutlineQuestionMarkCircle className="text-orange-600 dark:text-orange-400 text-xl" />
                      </div>
                    ) : (
                      <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                        <HiOutlineSpeakerphone className="text-blue-600 dark:text-blue-400 text-xl" />
                      </div>
                    )}

                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            post.data.type === "question"
                              ? "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
                              : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                          }`}
                        >
                          {post.data.type === "question"
                            ? "Question"
                            : "Announcement"}
                        </span>

                        {!post.data.approved && (
                          <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-full text-xs font-medium">
                            Pending Approval
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <HiOutlineUserCircle className="text-lg" />
                        <span>{post.data.createdBy}</span>
                        <span>•</span>
                        <BiTime className="text-base" />
                        <span>{formatTimeAgo(post.data.timestamp)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Admin Actions */}
                  {isAdminView && admins.includes(user.email) && (
                    <div className="flex items-center gap-2">
                      {!post.data.approved && (
                        <button
                          onClick={() => handleApprove(post.id)}
                          className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900 rounded-lg transition-colors duration-200"
                          title="Approve Post"
                        >
                          <BiCheck className="text-lg" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(post.id)}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900 rounded-lg transition-colors duration-200"
                        title="Delete Post"
                      >
                        <BiTrash className="text-lg" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Post Content */}
              <div className="p-8">
                <div
                  className="prose prose-blue dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 mb-7"
                  dangerouslySetInnerHTML={{ __html: post.data.content }}
                />

                {/* Post Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => handleUpvote(post.id, false, null)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                        post.data.upvotedBy.includes(userId)
                          ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                          : "bg-gray-100 text-gray-700 dark:bg-slate-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-500"
                      }`}
                    >
                      {post.data.upvotedBy.includes(userId) ? (
                        <BiSolidUpvote className="text-lg" />
                      ) : (
                        <BiUpvote className="text-lg" />
                      )}
                      <span>{post.data.upvotes}</span>
                    </button>

                    {post.data.type === "question" && (
                      <>
                        <button
                          onClick={() => toggleReplyForm(post.id)}
                          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 dark:bg-slate-600 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-slate-500 transition-colors duration-200"
                        >
                          <BiComment className="text-lg" />
                          Reply
                        </button>

                        <button
                          onClick={() => toggleReplies(post.id)}
                          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 dark:bg-slate-600 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-slate-500 transition-colors duration-200"
                        >
                          <BiMessageSquareDetail className="text-lg" />
                          <span>
                            {
                              post.data.replies.filter(
                                (reply) => reply.approved
                              ).length
                            }{" "}
                            Replies
                          </span>
                          {visibleReplies[post.id] ? (
                            <BiChevronUp className="text-lg" />
                          ) : (
                            <BiChevronDown className="text-lg" />
                          )}
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Reply Form */}
                {replyFormVisible[post.id] && (
                  <div className="mt-7 p-5 bg-gray-50 dark:bg-slate-700 rounded-lg">
                    <form onSubmit={handleReply}>
                      <div className="mb-4">
                        <Editor
                          onInit={(evt, editor) => (editorRef.current = editor)}
                          apiKey="bmcdss687jwqtyt2iwkph4vn5b0epn6f4wc420ezudzsnvff"
                          init={{
                            height: 200,
                            menubar: false,
                            plugins:
                              "anchor autolink charmap codesample emoticons link lists searchreplace visualblocks wordcount",
                            toolbar:
                              "undo redo | bold italic underline | link | numlist bullist | removeformat | codesample",
                            skin: document.documentElement.classList.contains(
                              "dark"
                            )
                              ? "oxide-dark"
                              : "oxide",
                            content_css:
                              document.documentElement.classList.contains(
                                "dark"
                              )
                                ? "dark"
                                : "default",
                          }}
                        />
                      </div>
                      <div className="flex gap-3">
                        <button
                          type="submit"
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200"
                        >
                          Post Reply
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setReplyFormVisible((prev) => ({
                              ...prev,
                              [post.id]: false,
                            }))
                          }
                          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-slate-600 dark:hover:bg-slate-500 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors duration-200"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Replies */}
                {visibleReplies[post.id] && (
                  <div className="mt-7 space-y-5">
                    {post.data.replies
                      ?.filter(
                        (reply) =>
                          reply.approvedBy || admins.includes(user.email)
                      )
                      .map((reply, index) => (
                        <div
                          key={index}
                          className="p-5 bg-gray-50 dark:bg-slate-700 rounded-lg border-l-4 border-blue-500"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                              <HiOutlineUserCircle className="text-lg" />
                              <span className="font-medium">
                                {reply.createdBy}
                              </span>
                              <span>•</span>
                              <BiTime className="text-base" />
                              <span>{formatTimeAgo(reply.timestamp)}</span>
                              {!reply.approved && (
                                <>
                                  <span>•</span>
                                  <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-full text-xs font-medium">
                                    Pending
                                  </span>
                                </>
                              )}
                            </div>

                            {isAdminView && admins.includes(user.email) && (
                              <div className="flex items-center gap-2">
                                {!reply.approved && (
                                  <button
                                    onClick={() =>
                                      handleApproveReply(post.id, index)
                                    }
                                    className="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900 rounded transition-colors duration-200"
                                    title="Approve Reply"
                                  >
                                    <BiCheck className="text-base" />
                                  </button>
                                )}
                                <button
                                  onClick={() =>
                                    handleDeleteReply(post.id, index)
                                  }
                                  className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900 rounded transition-colors duration-200"
                                  title="Delete Reply"
                                >
                                  <BiTrash className="text-base" />
                                </button>
                              </div>
                            )}
                          </div>

                          <div
                            className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 mb-4"
                            dangerouslySetInnerHTML={{ __html: reply.content }}
                          />

                          <button
                            onClick={() => handleUpvote(post.id, true, index)}
                            className={`flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 ${
                              reply.upvotedBy.includes(userId)
                                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                : "bg-gray-100 text-gray-700 dark:bg-slate-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-500"
                            }`}
                          >
                            {reply.upvotedBy.includes(userId) ? (
                              <BiSolidUpvote className="text-base" />
                            ) : (
                              <BiUpvote className="text-base" />
                            )}
                            <span>{reply.upvotes}</span>
                          </button>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {filteredPosts.length === 0 && (
            <div className="text-center py-12">
              <BiMessageSquareDetail className="mx-auto text-6xl text-gray-300 dark:text-gray-600 mb-4" />
              <h3 className="text-xl font-medium text-gray-500 dark:text-gray-400 mb-2">
                No discussions found
              </h3>
              <p className="text-gray-400 dark:text-gray-500">
                {searchTerm || filterType !== "all"
                  ? "Try adjusting your search or filters"
                  : "Be the first to start a discussion!"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Discussion;
