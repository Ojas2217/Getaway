import { useState, useEffect } from 'react'
import Header from '../components/header'
import Footer from '../components/Footer'

function App() {
  const [policies, setPolicies] = useState({})
  const [backend, setBackend] = useState("")
  const [prefix, setPrefix] = useState("")
  const [cachedur, setCachedur] = useState(0)
  const [timeout, setTimeout] = useState(0)
  const [rateRequests, setRateRequests] = useState(0)
  const [rateWindow, setRateWindow] = useState(0)
   const [authMap, setAuthMap] = useState({});

  useEffect(() => {
    fetch("http://127.0.0.1:3000/policies")
      .then(res => res.json())
      .then(res => setPolicies(res))
      .catch(e => console.log("Policy engine is down : " + e));
  }, []);
  console.log(policies)

  async function handleUpdate() {
    if (!backend) {
      alert("Backend URL is required");
      return;
    }
    let p = {
      "backend": backend,
      "path_prefix": prefix,
      "rate_limit": {
        "rate_limit_requests": rateRequests,
        "rate_limit_window": rateWindow
      },
      "authorization": authMap,
      "cache_duration": cachedur,
      "request_timeout": timeout
    }
    await updatePolicies(p)


    async function updatePolicies(new_policies) {
      const res = await fetch("http://127.0.0.1:3000/policies", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(new_policies)
      }).catch(e => console.log("policy engine is down"))

      if (!res.ok) {
        const err = await res.json();
        alert("Error" + err.error);
        setPolicies(err.old);
        return;
      }

      let p = await res.json();
      setPolicies(p)

    }
  }
  const add = () => {
    setAuthMap({ ...authMap, "": ""});
  };

  
  const remove = (token) => {
    const updated = { ...authMap };
    delete updated[token];
    setAuthMap(updated);
  };

  const update = (oldToken, newToken, newUser) => {
    const updated = { ...authMap };
    delete updated[oldToken]; 
    if (newToken) {
      updated[newToken] = newUser; 
    }
    setAuthMap(updated);
  };
  return (

    <div className=' text-[#693f39] '>

      <div className="  flex flex-col items-start justify-between border-gray-500 border-b p-6 space-y-10">
        <h1>Backend</h1>
        <input className=' bg-[#c2241241] border-none outline-0 rounded-md w-56 p-1.5' onChange={e => setBackend(e.target.value) } type="text" placeholder='backend URL' value={backend}></input>
        <input className=' bg-[#c2241241] border-none outline-0 rounded-md w-56 p-1.5' onChange={e =>setPrefix(e.target.value) } type="text" placeholder='prefix (blank if none)' value={prefix}></input>
      </div>
      <div className="  flex flex-col items-start justify-between border-gray-500 border-b p-6 space-y-10">
        <h1>Authorization</h1>
        {Object.entries(authMap).map(([token, user], index) => (
        <div key={index} className=' flex space-x-7'>
          <input className=' bg-[#c2241241] border-none outline-0 rounded-md w-56 p-1.5' type="text"placeholder="token (unique)"value={token} onChange={e =>update(token, e.target.value, user)}/>
          <input className=' bg-[#c2241241] border-none outline-0 rounded-md w-56 p-1.5' type="text" placeholder="user" value={user} onChange={e => update(token, token, e.target.value)}/>
          <button className=' bg-[#ff1900b8] border-none outline-0 rounded-md w-40 p-1.5' onClick={() => remove(token)}>Remove</button>
        </div>
      ))}
      <button className=' bg-[#ff1900b8] border-none outline-0 rounded-md w-40 p-1.5' onClick={add}>Add User</button>
      </div>
      <div className="  flex flex-col items-start justify-between border-gray-500 border-b p-6 space-y-10">
        <h1>Cache</h1>
        <input className=' bg-[#c2241241] border-none outline-0 rounded-md w-56 p-1.5' onChange={e => setCachedur(e.target.value) } type="number" placeholder='cache duration (seconds)'></input>
      </div>

      <div className="  flex flex-col items-start justify-between  p-6 space-y-10">
        <h1>Timeout & Rate Limit</h1>
        <input className=' bg-[#c2241241] border-none outline-0  rounded-md w-56 p-1.5' onChange={e =>  setTimeout(e.target.value) } type="number" placeholder='timeout duration (seconds)'></input>
        <input className=' bg-[#c2241241] border-none outline-0 rounded-md w-56 p-1.5' onChange={e => setRateRequests(e.target.value) } type="number" placeholder='rate limit after X requests'></input>
        <input className=' bg-[#c2241241] border-none outline-0  rounded-md w-56 p-1.5' onChange={e => setRateWindow(e.target.value) } type="number " placeholder='rate limit window'></input>
      </div>
    </div>
  )
}


export default App
