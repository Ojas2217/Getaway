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

  useEffect(() => {
    fetch("http://127.0.0.1:3000/policies")
      .then(res => res.json())
      .then(res => setPolicies(res))
      .catch(e => console.log("Policy engine is down : " + e));
  }, []);
  console.log(backend)

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
      "authorization": {
        "token1": "user1",
        "token2": "token2"
      },
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
  return (
    
    <div className=' text-[#693f39] '>

      <Header />
      <div className="  flex flex-col items-start justify-between border-gray-500 border-b pt-6 pb-6 pl-8 pr-8 space-y-10">
        <h1>Backend</h1>
        <input className=' bg-[#c2241241] border-none outline-0 rounded-md w-56 p-1.5' onKeyDown={e => { if (e.key == "Enter") setBackend("https://" + e.target.value) }} type="text" placeholder='backend URL'></input>
        <input className=' bg-[#c2241241] border-none outline-0 rounded-md w-56 p-1.5' onKeyDown={e => { if (e.key == "Enter") setPrefix(e.target.value) }} type="text" placeholder='prefix (blank if none)'></input>
      </div>
      <div className="  flex flex-col items-start justify-between border-gray-500 border-b pt-6 pb-6 pl-8 pr-8 space-y-10">
        <h1>Authorization</h1>
        <h3>todo</h3>
      </div>
      <div className="  flex flex-col items-start justify-between border-gray-500 border-b pt-6 pb-6 pl-8 pr-8 space-y-10">
        <h1>Cache</h1>
        <input className=' bg-[#c2241241] border-none outline-0 rounded-md w-56 p-1.5' onKeyDown={e => { if (e.key == "Enter") setCachedur(e.target.value) }} type="number" placeholder='cache duration (seconds)'></input>
      </div>

      <div className="  flex flex-col items-start justify-between  pt-6 pb-6 pl-8 pr-8 space-y-10">
        <h1>Timeout & Rate Limit</h1>
        <input className=' bg-[#c2241241] border-none outline-0  rounded-md w-56 p-1.5' onKeyDown={e => { if (e.key == "Enter") setTimeout(e.target.value) }} type="number" placeholder='timeout duration (seconds)'></input>
        <input className=' bg-[#c2241241] border-none outline-0 rounded-md w-56 p-1.5' onKeyDown={e => { if (e.key == "Enter") setRateRequests(e.target.value) }} type="number" placeholder='rate limit after X requests'></input>
        <input className=' bg-[#c2241241] border-none outline-0  rounded-md w-56 p-1.5' onKeyDown={e => { if (e.key == "Enter") setRateWindow(e.target.value) }} type="number " placeholder='rate limit window'></input>
      </div>
      <Footer/>
    </div>
  )
}


export default App
