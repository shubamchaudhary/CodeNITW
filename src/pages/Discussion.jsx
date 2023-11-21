import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { getAuth } from "firebase/auth";
import { collection, addDoc, getDocs, query, orderBy, doc, updateDoc, arrayUnion, arrayRemove, increment, getDoc } from 'firebase/firestore';
import { Editor } from '@tinymce/tinymce-react';
import { toast } from "react-toastify";

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
  const editorRef = useRef(null);


  useEffect(() => {
    const fetchData = async () => {
      const q = query(collection(db, "posts"), orderBy("timestamp" , "desc"));
      const querySnapshot = await getDocs(q);
      setPosts(querySnapshot.docs?.map(doc => ({ id: doc.id, data: doc.data() })));
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
    };

    const docRef = await addDoc(collection(db, "posts"), newPost);

    // Update the local state
    setPosts(prevPosts => [...prevPosts, { id: docRef.id, data: newPost }]);
    setContent('');
    toast.success("Post submitted successfully!");
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
    };

    await updateDoc(postRef, {
      replies: arrayUnion(newReply),
    });

    // Update the local state
    const postIndex = posts.findIndex(p => p.id === currentQuestion);
    posts[postIndex].data.replies.push(newReply);
    setPosts([...posts]);

    setReplyContent('');
    toast.success("Reply submitted successfully!");
  };

  const handleUpvote = async (postId, isReply, replyIndex) => {
    const postRef = doc(db, "posts", postId);
    const post = await (await getDoc(postRef)).data();

    let newPosts = [...posts]; // Copy the current posts state

    if (isReply) {
      const replies = post.replies;
      if (Array.isArray(replies[replyIndex].upvotedBy) && replies[replyIndex].upvotedBy.includes(userId)) {
        replies[replyIndex].upvotes -= 1;
        replies[replyIndex].upvotedBy = replies[replyIndex].upvotedBy.filter(id => id !== userId);
      } else {
        replies[replyIndex].upvotes += 1;
        replies[replyIndex].upvotedBy.push(userId);
      }

      // Update the document in Firestore
      await updateDoc(postRef, { replies });

      // Update the local state
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

      // Update the document in Firestore
      await updateDoc(postRef, { upvotes: post.upvotes, upvotedBy: post.upvotedBy });

      // Update the local state
      const postIndex = newPosts.findIndex(p => p.id === postId);
      newPosts[postIndex].data = post;
    }

    setPosts(newPosts); // Update the posts state
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

      <div className="bg-gray-100 min-h-screen p-4 flex justify-center">
        <div className="w-[80%] sm:w-3/4  bg-white shadow-md rounded-lg p-4">
          {posts?.map((post) => (
            <div key={post.id} className="mb-4 bg-white border-2 border-gray-200 p-4 rounded-lg shadow">
              <div className="flex justify-between mb-2">
                <h2 className={post.data.type === 'question' ? 'font-bold text-blue-500' : 'font-bold text-green-500'}>{post.data.type === 'question' ? 'Question' : 'Announcement'}</h2>
                { post.data.type === 'question' && <p className={post.data.type === 'question' && 'font- text-blue-400'}>{post.data.type === 'question' && 'From :  '}{post.data.createdBy}</p>}
              </div>
              <p className='mb-[15px]' dangerouslySetInnerHTML={{ __html: post.data.content }}></p>
              <div className={post.data.type === 'question' ? 'font- text-blue-400 flex justify-between mb-4'  : 'font-bold text-green-500'}>
                <button onClick={() => handleUpvote(post.id, false, null)} className="mr-2 bg-blue-500 text-white px-2 py-1 rounded">{post.data.upvotedBy.includes(userId) ? 'Remove Vote' : 'Upvote'} ({post.data.upvotes})</button>
                {post.data.type === 'question' && <button onClick={() => toggleReplyForm(post.id)} className="bg-green-500 text-white px-2 py-1 rounded">Reply</button>}
                {post.data.type === 'question' && <button onClick={() => toggleReplies(post.id)} className="bg-red-500 text-white px-2 py-1 rounded">{visibleReplies[post.id] ? 'Hide Replies' : 'View Replies'} ({post.data.replies.length})</button>}
              </div>
              {visibleReplies[post.id] && (
                <div>
                  {post.data.replies?.map((reply, index) => (
                    <div key={index} className="mb-2 ml-4 bg-gray-100 border-2 border-gray-200 p-4 rounded shadow">
                      <div className="flex justify-start">
                      <p className="font-bold text-green-500">Replied by: {reply.createdBy}</p>
                      </div>
                      <p className='text-gray-400 font-semibold'dangerouslySetInnerHTML={{ __html: reply.content }} />
                      <div className="flex justify-end text-green-600 ">
                        <button onClick={() => handleUpvote(post.id, true, index)} className="bg-blue-500 text-white px-2 py-1 rounded">Upvote ({reply.upvotes})</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {replyFormVisible[post.id] && (
                <form onSubmit={handleReply} className="mb-4">
                  <Editor
                    onInit={(evt, editor) => editorRef.current = editor}
                    apiKey='bmcdss687jwqtyt2iwkph4vn5b0epn6f4wc420ezudzsnvff'
                    init={{
                      height: 400,
                      menubar: false,
                      plugins: 'mentions anchor autolink charmap codesample emoticons image link lists media searchreplace table visualblocks wordcount checklist mediaembed casechange export formatpainter pageembed permanentpen footnotes advtemplate advtable advcode editimage tableofcontents mergetags powerpaste tinymcespellchecker autocorrect a11ychecker typography inlinecss code quote',
                      toolbar: 'undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | link image media table mergetags | align lineheight | tinycomments | checklist numlist bullist indent outdent | emoticons charmap | removeformat | code quote',
                    }}
                  />
                  <button type="submit" className="bg-blue-500 m-[5px] text-white px-2 py-1 rounded"> Post Reply</button>
                </form>
              )}
             
            </div>
          ))}
          <form onSubmit={handleSubmit} className="mb-4">
            <select onChange={(e) => setFormType(e.target.value)} className="mr-2 bg-gray-200 text-gray-700 px-2 py-1 rounded">
              <option value="question">Question</option>
              {user.email === 'sc922055@student.nitw.ac.in' || user.email === 'rk972006@student.nitw.ac.in'  && (
                <option value="post">Post</option>
              )}
            </select>
            <Editor
              onInit={(evt, editor) => editorRef.current = editor}
              apiKey='bmcdss687jwqtyt2iwkph4vn5b0epn6f4wc420ezudzsnvff'
              init={{
                height: 400,
                menubar: false,
                plugins: 'mentions anchor autolink charmap codesample emoticons image link lists media searchreplace table visualblocks wordcount checklist mediaembed casechange export formatpainter pageembed permanentpen footnotes advtemplate advtable advcode editimage tableofcontents mergetags powerpaste tinymcespellchecker autocorrect a11ychecker typography inlinecss code quote',
                toolbar: 'undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | link image media table mergetags | align lineheight | tinycomments | checklist numlist bullist indent outdent | emoticons charmap | removeformat | code quote',
              }}
            />
            <button type="submit" className="bg-blue-500 text-white px-2 py-1 rounded">Post</button>
          </form>
        </div>
      </div>
  );
};

export default Discussion;