import React from "react";
// import Moment from "react-moment";
import { Link } from "react-router-dom";
import { MdLocationOn, MdDelete, MdModeEditOutline } from "react-icons/md";

export default function ListingItem({ listing, id, onDelete, onEdit }) {
  return (
    <li className=" relative bg-white   items-center shadow-md hover:shadow-xl rounded-md overflow-hidden transition-shadow duration-150 m-[10px]">
      <Link className="contents" to={`/category/${listing.type}/${id}`}>
        <div className="w-full p-[10px]">
          <div className="flex items-center space-x-1">
            <MdLocationOn className="h-4 w-4 text-green-600" />
            <p className="font-semibold text-sm mb-[2px] text-gray-600 truncate">
              {listing.name}
            </p>
          </div>
        </div>
      </Link>
      {/* {onEdit && (
        <MdModeEditOutline
          onClick={() => onEdit(listing.id)}
          className="absolute bottom-2 right-[32px] text-xl"
        />
      )}
      {onDelete && (
        <MdDelete
          onClick={() => onDelete(listing.id)}
          className="absolute bottom-2 right-2 text-xl text-red-500"
        />
      )} */}
    </li>
  );
}
