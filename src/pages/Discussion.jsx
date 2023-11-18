import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { getAuth } from "firebase/auth";
import { collection, addDoc, getDocs, query, orderBy, doc, updateDoc, arrayUnion, arrayRemove, increment, getDoc } from 'firebase/firestore';

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

  useEffect(() => {
    const fetchData = async () => {
      const q = query(collection(db, "posts"), orderBy("timestamp"));
      const querySnapshot = await getDocs(q);
      setPosts(querySnapshot.docs.map(doc => ({ id: doc.id, data: doc.data() })));
    };

    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    await addDoc(collection(db, "posts"), {
      type: formType,
      content: content,
      upvotes: 0,
      timestamp: new Date(),
      replies: [],
      upvotedBy: [],
      createdBy: user.displayName,
    });

    setContent('');
  };

  const handleReply = async (e) => {
    e.preventDefault();

    const postRef = doc(db, "posts", currentQuestion);
    await updateDoc(postRef, {
      replies: arrayUnion({
        content: replyContent,
        upvotes: 0,
        timestamp: new Date(),
        upvotedBy: [],
        createdBy: user.displayName,
      }),
    });

    setReplyContent('');
  };

  const handleUpvote = async (postId, isReply, replyIndex) => {
    const postRef = doc(db, "posts", postId);
    const post = await (await getDoc(postRef)).data();

    if (isReply) {
      const replies = post.replies;
      if (replies[replyIndex].upvotedBy.includes(userId)) {
        replies[replyIndex].upvotes -= 1;
        replies[replyIndex].upvotedBy = replies[replyIndex].upvotedBy.filter(id => id !== userId);
      } else {
        replies[replyIndex].upvotes += 1;
        replies[replyIndex].upvotedBy.push(userId);
      }

      await updateDoc(postRef, {
        replies: replies,
      });
    } else {
      if (post.upvotedBy.includes(userId)) {
        await updateDoc(postRef, {
          upvotes: increment(-1),
          upvotedBy: arrayRemove(userId),
        });
      } else {
        await updateDoc(postRef, {
          upvotes: increment(1),
          upvotedBy: arrayUnion(userId),
        });
      }
    }
  };

  const toggleReplies = (postId) => {
    setVisibleReplies(prevState => ({
      ...prevState,
      [postId]: !prevState[postId]
    }));
  };

  const toggleReplyForm = (postId) => {
    setReplyFormVisible(prevState => ({
      ...prevState,
      [postId]: !prevState[postId]
    }));
  };

  return (
    <div className="bg-blue-100 min-h-screen p-4 flex justify-center">
      <div className="w-full sm:w-3/4 lg:w-1/2">
        {posts.map((post) => (
          <div key={post.id} className="mb-4 bg-blue-50 border-2 border-blue-200 p-4 rounded">
            <div className="flex justify-between mb-2">
              <h2 className={post.data.type === 'question' ? 'font-bold text-red-500' : 'font-bold text-orange-500'}>{post.data.type === 'question' ? 'Question' : 'Announcement'}</h2>
              <p className={post.data.type === 'question' ? 'font- text-red-400' : 'font-bold text-orange-500'}>{post.data.type === 'question' ? 'From: ' : 'Posted by: '}{post.data.createdBy}</p>
            </div>
            <p >{post.data.content}</p>
            <div className={post.data.type === 'question' ? 'font- text-red-400 flex justify-between mb-4'  : 'font-bold text-orange-500'}>
              <button onClick={() => handleUpvote(post.id, false, null)} className="mr-2">Upvote ({post.data.upvotes})</button>
              {post.data.type === 'question' && <button onClick={() => toggleReplyForm(post.id)}>Reply</button>}
              {post.data.type === 'question' && <button onClick={() => toggleReplies(post.id)}>{visibleReplies[post.id] ? 'Hide Replies' : 'View Replies'} ({post.data.replies.length})</button>}
            </div>
            {visibleReplies[post.id] && (
              <div>
                {post.data.replies?.map((reply, index) => (
                  <div key={index} className="mb-2 bg-blue-50 border-2 border-blue-200 p-4 rounded">
                    <div className="flex justify-start">
                    <p className="font-bold text-green-500">Replied by: {reply.createdBy}</p>
                    </div>
                    <p className='text-gray-400 font-semibold'>{reply.content}</p>
                    <div className="flex justify-end text-green-600 ">
                      <button onClick={() => handleUpvote(post.id, true, index)}>Upvote ({reply.upvotes})</button>
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
            <option value="post">Post</option>
          </select>
          <input type="text" value={content} onChange={(e) => setContent(e.target.value)} required className="mr-2" />
          <button type="submit" className="bg-blue-500 text-white px-2 py-1">Post</button>
        </form>
      </div>
    </div>
  );
};

export default Discussion;