import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { getAuth } from "firebase/auth";
import { collection, addDoc, getDocs, query, orderBy, doc, updateDoc, arrayUnion, deleteDoc, getDoc } from 'firebase/firestore';

const Discussion = () => {
  const [posts, setPosts] = useState([]);
  const [formType, setFormType] = useState('question');
  const [content, setContent] = useState('');
  const [replyContent, setReplyContent] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const auth = getAuth();
  const user = auth.currentUser;
  const userId = user.uid;

  const [visibleReplies, setVisibleReplies] = useState({});
  const [replyFormVisible, setReplyFormVisible] = useState({});

  const admins = [ 'rk972006@student.nitw.ac.in'];

  useEffect(() => {
    const fetchData = async () => {
      const q = query(collection(db, "posts"), orderBy("timestamp", "desc"));
      const querySnapshot = await getDocs(q);
      setPosts(querySnapshot.docs?.map(doc => ({ id: doc.id, data: doc.data() })));
    };

    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newPost = {
      type: formType,
      content: content,
      upvotes: 0,
      timestamp: new Date(),
      replies: [],
      upvotedBy: [],
      createdBy: user.displayName,
      approved: admins.includes(user.email),
      approvedBy: admins.includes(user.email) ? user.email : null,
    };

    const docRef = await addDoc(collection(db, "posts"), newPost);

    setPosts(prevPosts => [...prevPosts, { id: docRef.id, data: newPost }]);
    setContent('');

    if (!admins.includes(user.email)) {
      alert('Your response will be reflected after admins approval');
    }
  };

  const handleReply = async (e) => {
    e.preventDefault();
     
    const postRef = doc(db, "posts", currentQuestion);
    const newReply = {
      content: replyContent,
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

    const postIndex = posts.findIndex(p => p.id === currentQuestion);
    posts[postIndex].data.replies.push(newReply);
    setPosts([...posts]);

    setReplyContent('');

    if (!admins.includes(user.email)) {
      alert('Your response will be reflected after admins approval');
    }
  };

  const handleUpvote = async (postId, isReply, replyIndex) => {
    const postRef = doc(db, "posts", postId);
    const post = await (await getDoc(postRef)).data();

    let newPosts = [...posts];

    if (isReply) {
      const replies = post.replies;
      if (Array.isArray(replies[replyIndex].upvotedBy) && replies[replyIndex].upvotedBy.includes(userId)) {
        replies[replyIndex].upvotes -= 1;
        replies[replyIndex].upvotedBy = replies[replyIndex].upvotedBy.filter(id => id !== userId);
      } else {
        replies[replyIndex].upvotes += 1;
        replies[replyIndex].upvotedBy.push(userId);
      }

      await updateDoc(postRef, { replies });

      const postIndex = newPosts.findIndex(p => p.id === postId);
      newPosts[postIndex].data.replies = replies;
    } else {
      if (Array.isArray(post.upvotedBy) && post.upvotedBy.includes(userId)) {
        post.upvotes -= 1;
        post.upvotedBy = post.upvotedBy.filter(id => id !== userId);
      } else {
        post.upvotes += 1;
        post.upvotedBy.push(userId);
      }

      await updateDoc(postRef, { upvotes: post.upvotes, upvotedBy: post.upvotedBy });

      const postIndex = newPosts.findIndex(p => p.id === postId);
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

    const postIndex = posts.findIndex(p => p.id === postId);
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

    const postIndex = posts.findIndex(p => p.id === postId);
    posts[postIndex].data.replies = post.replies;
    setPosts([...posts]);
  };

  const handleDelete = async (postId) => {
    if (window.confirm('Do you want to delete this post?')) {
      const postRef = doc(db, "posts", postId);
      await deleteDoc(postRef);

      setPosts(posts.filter(p => p.id !== postId));
    }
  };

  const toggleReplies = (postId) => {
    setVisibleReplies(prevState => ({
      ...prevState,
      [postId]: !prevState[postId]
    }));
  };

  const toggleReplyForm = (postId) => {
    setCurrentQuestion(postId);
    setReplyFormVisible(prevState => ({
      ...prevState,
      [postId]: !prevState[postId]
    }));
  };

  return (
    <div className="bg-blue-100 min-h-screen p-4 flex justify-center">
      <div className="w-full sm:w-3/4 lg:w-1/2">
        {posts?.filter(post => post.data.approvedBy || admins.includes(user.email)).map((post) => (
          <div key={post.id} className="mb-4 bg-blue-50 border-2 border-blue-200 p-4 rounded">
            <div className="flex justify-between mb-2">
              <h2 className={post.data.type === 'question' ? 'font-bold text-red-500' : 'font-bold text-orange-500'}>{post.data.type === 'question' ? 'Question' : 'Announcement'}</h2>
            { post.data.type === 'question' && <p className={post.data.type === 'question' && 'font- text-red-400'}>{post.data.type === 'question' && 'From :  '}{post.data.createdBy}</p>}
            </div>
            <p className='mb-[15px]'>{post.data.content}</p>
            <div className={post.data.type === 'question' ? 'font- text-red-400 flex justify-between mb-4'  : 'font-bold text-orange-500'}>
              <button onClick={() => handleUpvote(post.id, false, null)} className="mr-2">{post.data.upvotedBy.includes(userId) ? 'Remove Vote' : 'Upvote'} ({post.data.upvotes})</button>
              {post.data.type === 'question' && <button onClick={() => toggleReplyForm(post.id)}>Reply</button>}
              {post.data.type === 'question' && <button onClick={() => toggleReplies(post.id)}>{visibleReplies[post.id] ? 'Hide Replies' : 'View Replies'} ({post.data.replies.length})</button>}
              {admins.includes(user.email) && !post.data.approved && <button onClick={() => handleApprove(post.id)}>Approve</button>}
            </div>
            {user.email === 'rk972006@student.nitw.ac.in' && <button onClick={() => handleDelete(post.id)}>Delete</button>}
            {visibleReplies[post.id] && (
              <div>
                {post.data.replies?.filter(reply => reply.approvedBy || admins.includes(user.email)).map((reply, index) => (
                  <div key={index} className="mb-2 ml-4 bg-blue-50 border-2 border-blue-200 p-4 rounded">
                    <div className="flex justify-start">
                    <p className="font-bold text-green-500">Replied by: {reply.createdBy}</p>
                    </div>
                    <p className='text-gray-400 font-semibold'>{reply.content}</p>
                    <div className="flex justify-end text-green-600 ">
                      <button onClick={() => handleUpvote(post.id, true, index)}>Upvote ({reply.upvotes})</button>
                      {admins.includes(user.email) && !reply.approved && <button onClick={() => handleApproveReply(post.id, index)}>Approve</button>}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {replyFormVisible[post.id] && (
              <form onSubmit={handleReply} className="mb-4">
                <input type="text" value={replyContent} onChange={(e) => setReplyContent(e.target.value)} required className="mr-2" />
                <button type="submit" className="bg-blue-500 text-white px-2 py-1">Reply</button>
              </form>
            )}
           
          </div>
        ))}
        <form onSubmit={handleSubmit} className="mb-4">
          <select onChange={(e) => setFormType(e.target.value)} className="mr-2">
            <option value="question">Question</option>
            {user.email === 'rk972006@student.nitw.ac.in' && (
              <option value="post">Post</option>
            )}
          </select>
          <input type="text" value={content} onChange={(e) => setContent(e.target.value)} required className="mr-2" />
          <button type="submit" className="bg-blue-500 text-white px-2 py-1">Post</button>
        </form>
      </div>
    </div>
  );
};

export default Discussion;