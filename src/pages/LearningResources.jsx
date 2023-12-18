import React from 'react'
import { dsa,dev,core,ml } from '../Data/LearningResourcesData';

export default function LearningResources() {
  
  return (
    <div className="bg-blue-100 dark:bg-[#1C1C1EFF] dark:text-gray-200 min-h-screen p-4 flex justify-center">
      <div className="w-full sm:w-3/4 dark:bg-[#2C2C2EFF] bg-blue-50 shadow-md rounded-lg p-4">
        {dsa.map(({name, description, data}) => (
          <Container name={name} description={description} cards={data} card="dsa"/>
        ))}
        {core.map(({name, description, data}) => (
          <Container name={name} description={description} cards={data} card="core" />
        ))}
        {dev.map(({name, description, data}) => (
          <Container name={name} description={description} cards={data} card="dev" />
        ))}
        {/* {ml.map(({name, description, data}) => (
          <MLContainer name={name} description={description} cards={data} card="ml" />
        ))} */}
      </div>
    </div>
  )
}

export function Container({name, description, cards, card}){
  return (
    <div className='mb-4 bg-white dark:bg-[#3A3A3CFF] border-gray-200 p-10 rounded-lg shadow overflow-auto'>
      <div className='md:ml-[50px]'>
      <h2 className="font-bold text-3xl text-cyan-600 mb-8"> 
        <span className="h-6 flex items-center sm:h-7">
          <svg class="flex-shrink-0 h-20 w-12 text-cyan-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fill-rule="evenodd" d="M10 2a2 2 0 00-2 2v12a2 2 0 002 2 2 2 0 002-2V4a2 2 0 00-2-2zm3 2a3 3 0 11-6 0 3 3 0 016 0z" clip-rule="evenodd" />
          </svg>
          {name} 
        </span>
      </h2>
      <p className="mb-4 text-lg dark:text-gray-400 text-gray-700">{description}</p>
      <div className="flex flex-col md:ml-[50px]">
        { card==="dsa" && cards.map((card) => (
          <Card name={card.name} description={card.description} videoLink={card.videolink} problemSetLink={card.problemsetLink} subtopics={card.subtopics} card="dsa"/>
        ))}
         { card==="core" && cards.map((card) => (
          <Card name={card.name} description={card.description} videoLink={card.videolink} problemSetLink={card.problemsetLink} subtopics={card.subtopics} card="core"/>
        ))}
         { card==="dev" && cards.map((card) => (
          <Card name={card.name} description={card.description} videoLink={card.videolink} problemSetLink={card.problemsetLink} subtopics={card.subtopics} card="dev"/>
        ))}
        { card==="ml" && cards.map((card) => (
          <Card name={card.name} description={card.description} videoLink={card.videolink} problemSetLink={card.problemsetLink} subtopics={card.subtopics} card="ml"/>
        ))}
      </div>
      </div>
    </div>
  );
}


export function Card({name, description, videoLink, problemSetLink, subtopics, card}) {
  return (
    <div className="flex">
      <div className="flex flex-col items-center">
        <div className="h-5 w-5 rounded-full border-2 border-cyan-500 bg-white"></div>
        <div className={name === "C++ Standard Template Library" ? "w-1 h-[400px] md:h-[320px]  bg-cyan-500" : "w-1 h-[150px] md:h-20  bg-cyan-500"}></div>
      </div>
      <div className="pl-4">
        <p className="ml-2 dark:text-gray-400 font-semibold mb-2">
          {name}
        </p>
        <p className="ml-2 dark:text-gray-400 mb-2">
          <span className='font-normal'>{description}</span>
        </p>
        <p className="ml-2 dark:text-gray-400">
          <a href={videoLink} target="_blank" rel="noreferrer" className="text-blue-600 font-semibold mr-4">{card=="dsa" ?  "Youtube Playlist" : "Youtube Video 1"}</a>
          <a href={problemSetLink} target="_blank" rel="noreferrer" className="text-blue-600 font-semibold">{card=="dsa" ?  "Practice Sheet" : "Youtube Video 2"}</a>
        </p>
        {card=="dsa" && subtopics && subtopics.map((subtopic) => (
          <p className="ml-2 dark:text-gray-400">
            <a href={subtopic.link} target="_blank" rel="noreferrer" className="text-blue-600 font-semibold">{subtopic.name}</a>
          </p>
        ))}
      </div>
    </div>
  )
}


