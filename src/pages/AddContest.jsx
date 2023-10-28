import { useState } from "react";
import { Dna } from "react-loader-spinner";
import { toast } from "react-toastify";
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";
import { getAuth } from "firebase/auth";
import { v4 as uuidv4 } from "uuid";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";
import ContestImage from "../images/contest.png";

export default function AddContest() {
  const navigate = useNavigate();
  const auth = getAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "Starter 1",
    startingTime: "23rd January 2024, Wednesday, 5pm",
    duration: 90,
    link: "",
  });
  const { name, startingTime, duration, link } = formData;

  function onChange(e) {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.id]: e.target.value,
    }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    const formDataCopy = {
      ...formData,
      timestamp: serverTimestamp(),
      //this is uid of the user
      userRef: auth.currentUser.uid,
    };
    console.log(formDataCopy);
    const docRef = await addDoc(collection(db, "listings"), formDataCopy);
    setLoading(false);
    toast.success("contest added");
    navigate(`/`);
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Dna
          visible={true}
          height="500"
          width="500"
          ariaLabel="dna-loading"
          wrapperStyle={{}}
          wrapperClass="dna-wrapper"
        />
      </div>
    );
  }

  return (
    <main className="max-w-[800px] px-4 mx-auto mt-[50px]">
      <h1 className="text-3xl text-center mt-6 cursive">Add New Contest</h1>
      <form onSubmit={onSubmit}>
        <p className="text-lg mt-6 font-semibold">Contest Name</p>
        <input
          type="text"
          id="name"
          value={name}
          onChange={onChange}
          placeholder="Contest Name"
          required
          className="w-full px-4 py-2 text-xl text-gray-700 border-gray-300 rounded  text-center"
        />

        <p className="text-lg font-semibold">Starting time</p>
        <input
          type="text"
          id="startingTime"
          value={startingTime}
          onChange={onChange}
          placeholder="23rd January 2024, Wednesday, 5pm"
          required
          className="w-full px-4 py-2 text-xl text-gray-700 border-gray-300 rounded  text-center"
        />
        <p className="text-lg font-semibold">Duration in minutes</p>
        <input
          type="number"
          id="duration"
          value={duration}
          onChange={onChange}
          required
          className="w-full px-4 py-2 text-xl text-gray-700 border-gray-300  text-center"
        />
        <p className="text-lg font-semibold">Contest Link</p>
        <input
          type="text"
          id="link"
          value={link}
          onChange={onChange}
          placeholder="Contest Link"
          required
          className="w-full px-4 py-2 text-xl text-gray-700 border-gray-300 rounded  mb-6 text-center"
        />
        <button
          type="submit"
          className="mb-6 w-full px-7 py-3 bg-blue-600 text-white font-medium text-sm  rounded shadow-md "
        >
          Add Contest
        </button>
      </form>
    </main>
  );
}
// import { useState } from "react";
// import { Dna } from 'react-loader-spinner';
// import { toast } from "react-toastify";
// import {
//   getStorage,
//   ref,
//   uploadBytesResumable,
//   getDownloadURL,
// } from "firebase/storage";
// import { getAuth } from "firebase/auth";
// import { v4 as uuidv4 } from "uuid";
// import { addDoc, collection, serverTimestamp } from "firebase/firestore";
// import { db } from "../firebase";
// import { useNavigate } from "react-router-dom";

// export default function AddContest() {
//     const navigate = useNavigate();
//     const auth = getAuth();
//     const [geolocationEnabled, setGeolocationEnabled] = useState(false);
//     const [loading, setLoading] = useState(false);
//     const [formData, setFormData] = useState({
//       type: "rent",
//       name: "",
//       bedrooms: 1,
//       bathrooms: 1,
//       parking: false,
//       furnished: false,
//       address: "",
//       description: "",
//       offer: false,
//       regularPrice: 0,
//       discountedPrice: 0,
//       latitude: 0,
//       longitude: 0,
//       images: {},
//       });
//       const {
//         type,
//         name,
//         bedrooms,
//         bathrooms,
//         parking,
//         address,
//         furnished,
//         description,
//         offer,
//         regularPrice,
//         discountedPrice,
//         latitude,
//         longitude,
//         images,
//       } = formData;

//       function onChange(e) {
//         let boolean = null;
//         if (e.target.value === "true") {
//           boolean = true;
//         }
//         if (e.target.value === "false") {
//           boolean = false;
//         }
//         // Files
//         if (e.target.files) {
//           setFormData((prevState) => ({
//             ...prevState,
//             images: e.target.files,
//           }));
//         }
//         // Text/Boolean/Number
//         if (!e.target.files) {
//           setFormData((prevState) => ({
//             ...prevState,
//             [e.target.id]: boolean ?? e.target.value,
//           }));
//         }
//       }

//       async function onSubmit(e) {
//         e.preventDefault();
//         setLoading(true);
//         if (+discountedPrice >= +regularPrice) {
//           setLoading(false);
//           toast.error("Discounted price needs to be less than regular price");
//           return;
//         }
//         if (images.length > 6) {
//           setLoading(false);
//           toast.error("maximum 6 images are allowed");
//           return;
//         }
//         let geolocation = {};
//         let location;
//         if (geolocationEnabled) {
//           const response = await fetch(
//             `https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=${process.env.REACT_APP_GEOCODE_API_KEY}`
//           );
//           const data = await response.json();
//           console.log(data);
//           geolocation.lat = data.results[0]?.geometry.location.lat ?? 0;
//           geolocation.lng = data.results[0]?.geometry.location.lng ?? 0;

//           location = data.status === "ZERO_RESULTS" && undefined;

//           if (location === undefined) {
//             setLoading(false);
//             toast.error("please enter a correct address");
//             return;
//           }
//         } else {
//           geolocation.lat = latitude;
//           geolocation.lng = longitude;
//         }

//         async function storeImage(image) {
//           return new Promise((resolve, reject) => {
//             const storage = getStorage();
//             const filename = `${auth.currentUser.uid}-${image.name}-${uuidv4()}`;
//             const storageRef = ref(storage, filename);
//             const uploadTask = uploadBytesResumable(storageRef, image);
//             uploadTask.on(
//               "state_changed",
//               (snapshot) => {
//                 // Observe state change events such as progress, pause, and resume
//                 // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
//                 const progress =
//                   (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
//                 console.log("Upload is " + progress + "% done");
//                 switch (snapshot.state) {
//                   case "paused":
//                     console.log("Upload is paused");
//                     break;
//                   case "running":
//                     console.log("Upload is running");
//                     break;
//                 }
//               },
//               (error) => {
//                 // Handle unsuccessful uploads
//                 reject(error);
//               },
//               () => {
//                 // Handle successful uploads on complete
//                 // For instance, get the download URL: https://firebasestorage.googleapis.com/...
//                 getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
//                   resolve(downloadURL);
//                 });
//               }
//             );
//           });
//         }

//         const imgUrls = await Promise.all(
//           [...images].map((image) => storeImage(image))
//         ).catch((error) => {
//           setLoading(false);
//           toast.error("Images not uploaded");
//           return;
//         });

//             const formDataCopy = {
//               ...formData,
//               imgUrls,
//               geolocation,
//               timestamp: serverTimestamp(),
//               //this is uid of the user
//               userRef: auth.currentUser.uid,
//             };
//             delete formDataCopy.images;
//             !formDataCopy.offer && delete formDataCopy.discountedPrice;
//             delete formDataCopy.latitude;
//             delete formDataCopy.longitude;
//             const docRef = await addDoc(collection(db, "listings"), formDataCopy);
//             setLoading(false);
//             toast.success("Listing created");
//             navigate(`/category/${formDataCopy.type}/${docRef.id}`);
//           }

//           if (loading) {
//             return <div className="h-screen flex items-center justify-center">
//                 <Dna
//                   visible={true}
//                   height="500"
//                   width="500"
//                   ariaLabel="dna-loading"
//                   wrapperStyle={{}}
//                   wrapperClass="dna-wrapper"
//                 />
//        </div>
//           }

//   return (
//     <main className="max-w-[800px] px-4 mx-auto mt-[50px]">
//         <h1 className='text-3xl text-center mt-6 cursive'>
//             Create a Listing
//         </h1>
//         <form onSubmit={onSubmit}>
//            <p className="text-lg mt-6 font-semibold">Select (Sell / Rent)</p>
//            <div className='flex '>
//               <button  type="button"
//                id="type"
//                value="sale"
//                onClick={onChange}
//               className={`mr-3 px-7 py-3 font-medium text-sm  shadow-md rounded  w-full ${
//                 type === "rent"
//                   ? "bg-white text-black"
//                   : "bg-slate-600 text-white"
//               }`}>
//                 Sell
//               </button>
//               <button  type="button"
//                 id="type"
//                 value="rent"
//                 onClick={onChange}
//               className={`mr-3 px-7 py-3 font-medium text-sm  shadow-md rounded  w-full ${
//                 type === "sale"
//                   ? "bg-white text-black"
//                   : "bg-slate-600 text-white"
//               }`}>
//                 Rent
//               </button>
//            </div>
//             <p className="text-lg mt-6 font-semibold">Name</p>
//             <input
//                 type="text"
//                 id="name"
//                 value={name}
//                 onChange={onChange}
//                 placeholder="Name"
//                 maxLength="32"
//                 minLength="10"
//                 required
//                 className="w-full px-4 py-2 text-xl text-gray-700 border-gray-300 rounded  mb-6"
//         />
//          <div className="flex space-x-6 mb-6">
//            <div>
//             <p className="text-lg font-semibold">Bed Rooms</p>
//             <input
//               type="number"
//               id="bedrooms"
//               value={bedrooms}
//               onChange={onChange}
//               min="1"
//               max="50"
//               required
//               className="w-full px-4 py-2 text-xl text-gray-700 border-gray-300 rounded  text-center"
//             />
//            </div>
//            <div>
//             <p className="text-lg font-semibold">Bath Rooms</p>
//             <input
//               type="number"
//               id="bathrooms"
//               value={bathrooms}
//               onChange={onChange}
//               min="1"
//               max="50"
//               required
//               className="w-full px-4 py-2 text-xl text-gray-700 border-gray-300  text-center"
//             />
//           </div>
//          </div>
//          <p className="text-lg mt-6 font-semibold">Parking Spot</p>
//         <div className="flex">
//            <button
//             type="button"
//             id="parking"
//             value={true}
//             onClick={onChange}
//             className={`mr-3 px-7 py-3 font-medium text-sm shadow-md rounded  w-full ${
//               !parking ? "bg-white text-black" : "bg-slate-600 text-white"
//             }`}
//           >
//             Yes
//           </button>
//           <button
//             type="button"
//             id="parking"
//             value={false}
//             onClick={onChange}
//             className={`ml-3 px-7 py-3 font-medium text-sm shadow-md rounded w-full ${
//               parking ? "bg-white text-black" : "bg-slate-600 text-white"
//             }`}
//           >
//             No
//           </button>
//         </div>
//         <p className="text-lg mt-6 font-semibold">Furnished</p>
//         <div className="flex">
//           <button
//             type="button"
//             id="furnished"
//             value={true}
//             onClick={onChange}
//             className={`mr-3 px-7 py-3 font-medium text-sm shadow-md w-full ${
//               !furnished ? "bg-white text-black" : "bg-slate-600 text-white"
//             }`}
//           >
//             Yes
//           </button>
//           <button
//             type="button"
//             id="furnished"
//             value={false}
//             onClick={onChange}
//             className={`ml-3 px-7 py-3 font-medium text-sm  shadow-md w-full ${
//               furnished ? "bg-white text-black" : "bg-slate-600 text-white"
//             }`}
//           >
//             No
//           </button>
//         </div>
//         <p className="text-lg mt-6 font-semibold">Address</p>
//         <textarea
//            type="text"
//            id="address"
//            value={address}
//            onChange={onChange}
//            placeholder="Address"
//            required
//           className="w-full px-4 py-2 text-xl text-gray-700 bg-white border border-gray-300 rounded transition duration-150 ease-in-out focus:text-gray-700 focus:bg-white focus:border-slate-600 mb-6"
//         />
//          {!geolocationEnabled && (
//           <div className="flex space-x-6 justify-start mb-6">
//             <div className="">
//               <p className="text-lg font-semibold">Latitude</p>
//               <input
//                  type="number"
//                  id="latitude"
//                  value={latitude}
//                  onChange={onChange}
//                  required
//                  min="-90"
//                  max="90"
//                 className="w-full px-4 py-2 text-xl text-gray-700 bg-white border border-gray-300 rounded transition duration-150 ease-in-out focus:bg-white focus:text-gray-700 focus:border-slate-600 text-center"
//               />
//             </div>
//             <div className="">
//               <p className="text-lg font-semibold">Longitude</p>
//               <input
//                  type="number"
//                  id="longitude"
//                  value={longitude}
//                  onChange={onChange}
//                  required
//                  min="-180"
//                  max="180"
//                 className="w-full px-4 py-2 text-xl text-gray-700 bg-white border border-gray-300 rounded transition duration-150 ease-in-out focus:bg-white focus:text-gray-700 focus:border-slate-600 text-center"
//               />
//             </div>
//           </div>
//         )}
//          <p className="text-lg font-semibold">Description</p>
//         <textarea
//             type="text"
//             id="description"
//             value={description}
//             onChange={onChange}
//             placeholder="Description"
//             required
//           className="w-full px-4 py-2 text-xl text-gray-700 bg-white border border-gray-300 rounded mb-6"
//         />
//         <p className="text-lg font-semibold">Offer</p>
//         <div className="flex mb-6">
//           <button
//             type="button"
//             id="offer"
//             value={true}
//             onClick={onChange}
//             className={`mr-3 px-7 py-3 font-medium text-sm  shadow-md rounded  w-full ${
//               !offer ? "bg-white text-black" : "bg-slate-600 text-white"
//             }`}
//           >
//             Yes
//           </button>
//           <button
//               type="button"
//               id="offer"
//               value={false}
//               onClick={onChange}
//             className={`ml-3 px-7 py-3 font-medium text-sm  shadow-md rounded  w-full ${
//               offer ? "bg-white text-black" : "bg-slate-600 text-white"
//             }`}
//           >
//             No
//           </button>
//         </div>
//         <div className="flex items-center mb-6">
//           <div className="">
//             <p className="text-lg font-semibold">Regular price</p>
//             <div className="flex w-full justify-center items-center space-x-6">
//               <input
//                  type="number"
//                  id="regularPrice"
//                  value={regularPrice}
//                  onChange={onChange}
//                  min="10000"
//                  max="400000000"
//                  required
//                 className="w-full px-4 py-2 text-xl text-gray-700 bg-white border border-gray-300 rounded text-center"
//               />
//               {type === "rent" && (
//                 <div className="">
//                   <p className="text-md w-full whitespace-nowrap">₹/Month</p>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//         {offer && (
//           <div className="flex items-center mb-6">
//             <div className="">
//               <p className="text-lg font-semibold">Discounted price</p>
//               <div className="flex w-full justify-center items-center space-x-6">
//                 <input
//                    type="number"
//                    id="discountedPrice"
//                    value={discountedPrice}
//                    onChange={onChange}
//                   required={offer}
//                   min="10000"
//                   max="400000000"
//                   className="w-full px-4 py-2 text-xl text-gray-700 bg-white border border-gray-300 rounded  text-center"
//                 />
//                 {type === "rent" && (
//                   <div className="">
//                     <p className="text-md w-full whitespace-nowrap">
//                     ₹/Month
//                     </p>
//                   </div>
//                 )}
//               </div>
//             </div>
//           </div>
//         )}
//          <div className="mb-6">
//           <p className="text-lg font-semibold">Images</p>
//           <p className="text-gray-600">
//             The first image will be the cover (max 6)
//           </p>
//           <input
//             type="file"
//             id="images"
//             onChange={onChange}
//             accept=".jpg,.png,.jpeg"
//             multiple
//             required
//             className="w-full px-3 py-1.5 text-gray-700 bg-white border border-gray-300 rounded "
//           />
//         </div>
//         <button
//           type="submit"
//           className="mb-6 w-full px-7 py-3 bg-blue-600 text-white font-medium text-sm  rounded shadow-md "
//         >
//           Create Listing
//         </button>
//        </form>
//     </main>
//   )
// }
