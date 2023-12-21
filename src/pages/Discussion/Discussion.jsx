import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../firebase';
import { getAuth } from "firebase/auth";
import { collection, addDoc, getDocs, query, orderBy, doc, updateDoc, arrayUnion, deleteDoc, getDoc } from 'firebase/firestore';
import { Editor } from '@tinymce/tinymce-react';
import { toast } from "react-toastify";
import 'prismjs/themes/prism.css';
import { BiUpvote } from "react-icons/bi";
import { BiSolidUpvote } from "react-icons/bi";


const Discussion = () => {
  const [posts, setPosts] = useState([]);
  const [formType, setFormType] = useState('question');
  const [content, setContent] = useState('');
  const [replyContent, setReplyContent] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [isAdminView , setIsAdminView] = useState(false);
  const auth = getAuth();
  const user = auth.currentUser;
  const userId = user.uid;
  const admins = ['sc922055@student.nitw.ac.in', 'rk972006@student.nitw.ac.in'];
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
      approved: admins.includes(user.email),
      approvedBy: admins.includes(user.email) ? user.email : null,
    };

    const docRef = await addDoc(collection(db, "posts"), newPost);

    // Update the local state
    setPosts(prevPosts => [...prevPosts, { id: docRef.id, data: newPost }]);
    setContent('');
    if (!admins.includes(user.email)) {
      toast.info('Your response will be reflected after admins approval');
    }
    toast.info("Post submitted successfully!");
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

    // Update the local state
    const postIndex = posts.findIndex(p => p.id === currentQuestion);
    posts[postIndex].data.replies.push(newReply);
    setPosts([...posts]);

    setReplyContent('');

    toast.info("Reply submitted successfully!");
        
    if (!admins.includes(user.email)) {
      toast.info('Your response will be reflected after admins approval');
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

  const handleDeleteReply = async (postId, replyIndex) => {
  const postRef = doc(db, "posts", postId);
  const post = await (await getDoc(postRef)).data();

  post.replies.splice(replyIndex, 1);

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

      <div className="bg-blue-100 dark:bg-[#050b15] min-h-screen p-4 flex justify-center">
        { admins.includes(user.email) && <button onClick={() => setIsAdminView(prevState => !prevState)} className="absolute top-[100px] right-[5px] ">Toggle View</button>}
        <div className="w-[100%] sm:w-3/4 dark:bg-[#141a25]  bg-blue-50 shadow-md rounded-lg p-4">
          {posts?.filter(post => post.data.approvedBy || admins.includes(user.email)).map((post) => (
            <div key={post.id} className="mb-4 bg-white dark:bg-[#1c2432] border-gray-200 p-4 rounded-lg shadow overflow-auto">
              <div className="flex justify-between mb-2">
                <h2 className={post.data.type === 'question' ? 'font-bold text-2xl text-red-500' : 'font-bold text-2xl text-blue-600'}>{post.data.type === 'question' ? 'Question' : 'Announcement'}</h2>
                { post.data.type === 'question' && <p className={post.data.type === 'question' && 'font- text-red-400'}>{post.data.type === 'question' && 'From :  '}{post.data.createdBy}</p>}
              </div>
              <p className='mb-[15px] dark:text-white' dangerouslySetInnerHTML={{ __html: post.data.content }}></p>
              <div className={post.data.type === 'question' ? 'font- text-blue-400 flex justify-between mb-4'  : 'font-bold text-green-500'}>
              <button onClick={() => handleUpvote(post.id, false, null)} className="mr-2 flex justify-center text-yellow-600 font-bold px-2 py-1 rounded">
  {post.data.upvotedBy.includes(userId) ? <BiSolidUpvote className='text-xl mr-1 mt-[2px]' /> : <BiUpvote className='text-xl mt-[2px] mr-1'/>}
  {post.data.upvotedBy.includes(userId) ? ` Remove Vote` : ` Upvote`} ({post.data.upvotes})
</button>
                {post.data.type === 'question' && <button onClick={() => toggleReplyForm(post.id)} className="text-green-500 font-bold  px-2 py-1 rounded">Reply</button>}
                {post.data.type === 'question' && <button onClick={() => toggleReplies(post.id)} className="text-green-500 font-bold px-2 py-1 rounded">{visibleReplies[post.id] ? 'Hide Replies' : 'View Replies'} ({post.data.replies.filter(reply => reply.approved).length})</button>}
                { isAdminView && admins.includes(user.email) && !post.data.approved && <button onClick={() => handleApprove(post.id)} className="text-green-500  font-bold py-2 px-4 rounded">Approve</button>}
                { isAdminView && admins.includes(user.email) && <button onClick={() => handleDelete(post.id)} className="text-red-500 font-bold py-2 px-4 rounded ml-2" >Delete</button>}
               
              </div>
              
              {visibleReplies[post.id] && (
                <div>
                  {post.data.replies?.filter(reply => reply.approvedBy || admins.includes(user.email)).map((reply, index) => (
                    <div key={index} className="mb-2 ml-4 bg-gray-100 dark:bg-[#1f2836]  border-gray-200 p-4 rounded shadow">
                      <div className="flex justify-start">
                      <p className="font-bold text-green-500">Replied by: {reply.createdBy}</p>
                      </div>
                      <p className='text-gray-400 font-semibold'dangerouslySetInnerHTML={{ __html: reply.content }} />
                      <div className="flex justify-end text-green-600 ">
                      <button onClick={() => handleUpvote(post.id, true, index)} className="mr-2 flex justify-center text-yellow-600 font-bold px-2 py-1 rounded">
  {reply.upvotedBy.includes(userId) ? <BiSolidUpvote className='text-xl mr-1 mt-[2px]' /> : <BiUpvote className='text-xl mt-[2px] mr-1'/>}
  {reply.upvotedBy.includes(userId) ? ` Remove Vote` : ` Upvote`} ({reply.upvotes})
</button>
                        {isAdminView && admins.includes(user.email) && !reply.approved && 
                            <button 
                                onClick={() => handleApproveReply(post.id, index)} 
                                className="text-green-500 font-bold py-2 px-4 rounded"
                            >
                                Approve
                            </button>
                        }
                        {isAdminView && admins.includes(user.email) && 
                            <button 
                                onClick={() => handleDeleteReply(post.id, index)} 
                                className="text-red-500 font-bold py-2 px-4 rounded ml-2"
                            >
                                Delete
                            </button>
                        }
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
                      plugins: ' anchor autolink charmap codesample emoticons image link lists media searchreplace table visualblocks wordcount codesample quote',
                      toolbar: 'undo redo | blocks fontfamily fontsize | bold italic underline strikethrough forecolor backcolor | link image media table mergetags | align lineheight | tinycomments | checklist numlist bullist indent outdent | emoticons charmap | removeformat | codesample quote',
                    }}
                  />
                  <button type="submit" className="text-blue-500 m-[5px] px-2 py-1 rounded"> Post Reply</button>
                </form>
              )}
             
            </div>
          ))}
          <form onSubmit={handleSubmit} className="mb-4">
            <select onChange={(e) => setFormType(e.target.value)} className="mr-2 bg-gray-200 text-gray-700 px-2 py-1 rounded">
              <option value="question">Question</option>
              {(user.email === 'sc922055@student.nitw.ac.in' || user.email === 'rk972006@student.nitw.ac.in')  && (
                <option value="post">Post</option>
              )}
            </select>
            <Editor
                    onInit={(evt, editor) => editorRef.current = editor}
                    apiKey='bmcdss687jwqtyt2iwkph4vn5b0epn6f4wc420ezudzsnvff'
                    init={{
                      height: 400,
                      menubar: false,
                      plugins: ' anchor autolink charmap codesample emoticons image link lists media searchreplace table visualblocks wordcount codesample quote',
                      toolbar: 'undo redo | blocks fontfamily fontsize | bold italic underline strikethrough forecolor backcolor | link image media table mergetags | align lineheight | tinycomments | checklist numlist bullist indent outdent | emoticons charmap | removeformat | codesample quote',
                    }}
                  />
            <button type="submit" className="text-white bg-blue-700  m-[5px] px-2 py-1 rounded">Post</button>
          </form>
        </div>
      </div>
  );
};

export default Discussion;