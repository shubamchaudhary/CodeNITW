import React  from "react";
import { Leaderboard } from "flywheel-leaderboard";
import axios from 'axios'; 
import { SHA256, enc } from 'crypto-js';
export default function LeaderboardList(){
  const data = [
    {
      name : "Rohit Kumar",
      rollno : 2032546,
      score : 50,
      rank : 2
    },
    {
      name : "Shubam Kumar",
      rollno : 203254,
      score : 100,
      rank : 1
    }
  ]

  let StandingsData = {};
  // APi test 
  const rand = String(Math.floor(Math.random() * 100000)).padStart(6, '0');
  const current_time = String(Math.floor(Date.now() / 1000));
  const api_key = "7bcb2c2a57feab460343d341d164e26b4ae32fd1";
  const contest_id = "477676";
  const api_secret = "3e67186659f5f9f35c5841127c40a5b0339180b1";
  const api_sig = rand + '/contest.standings?apiKey=' + api_key + '&contestId=' + contest_id + '&time=' + current_time + '#' + api_secret;
  function sha512(str) {
    return crypto.subtle.digest("SHA-512", new TextEncoder("utf-8").encode(str)).then(buf => {
      return Array.prototype.map.call(new Uint8Array(buf), x=>(('00'+x.toString(16)).slice(-2))).join('');
    });
  }
  var hash;
  sha512(api_sig).then(x => {
    hash = x;
    hash = rand + hash;
    const url = `https://codeforces.com/api/contest.standings?contestId=${contest_id}&apiKey=${api_key}&time=${current_time}&apiSig=${hash}`;
    axios.get(url) 
    .then(response => { 
      console.log(response.data);
      StandingsData = response.data; // Access the response data 
    }) 
    .catch(error => { 
        console.log("Error");
    });
  });

  return (
    <section className="max-w-6xl mx-auto flex justify-center items-center flex-col mt-[100px]">
      <h1 className="text-3xl text-center  cursive">Leaderboard</h1>
      
      <Leaderboard 
        className='max-w-6xl' //tailwind class (optional)
        theme='cyan' //leaderboard theme. see docs for accepted values (optional)
        scoringMetric="score" //the property you wanna rank your data by (required)
        id="rollno" //the property you wanna id each item in your data by (required)
        cell1="name" //the first cell for your board (optional)
        cell2="score" //...
        cell3="rank" //...
        items={data} //the data you wanna use for your board. e.g. db response. (required)
        > 
      </Leaderboard>
    </section>
 );
}



// key: 7bcb2c2a57feab460343d341d164e26b4ae32fd1 
// secret: 3e67186659f5f9f35c5841127c40a5b0339180b1 
