import { useState, useEffect } from 'react'

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
      .catch(e => console.log("Policy engine is down"));
  }, []);
  console.log(backend)


  function handleUpdate(e, setter, s = "") {
    setter(s + e.target.value);
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
    updatePolicies(p).await

  }
  return (
    <div className="  flex items-start flex-col justify-center ml-10 space-y-10">
      <input className=' bg-gray-500 rounded-md w-56' onKeyDown={e => { if (e.key == "Enter") handleUpdate(e, setBackend, "https://") }} type="text" placeholder='backend'></input>
      <input className=' bg-gray-500 rounded-md w-56' onKeyDown={e => { if (e.key == "Enter") handleUpdate(e, setPrefix) }} type="text" placeholder='prefix (blank if none)'></input>
      <input className=' bg-gray-500 rounded-md w-56' onKeyDown={e => { if (e.key == "Enter") handleUpdate(e, setCachedur) }} type="text" placeholder='cache duration (seconds)'></input>
      <input className=' bg-gray-500 rounded-md w-56' onKeyDown={e => { if (e.key == "Enter") handleUpdate(e, setTimeout) }} type="text" placeholder='timeout duration (seconds)'></input>
      <input className=' bg-gray-500 rounded-md w-56' onKeyDown={e => { if (e.key == "Enter") handleUpdate(e, setRateRequests) }} type="text" placeholder='rate limit after X requests'></input>
      <input className=' bg-gray-500 rounded-md w-56' onKeyDown={e => { if (e.key == "Enter") handleUpdate(e, setRateWindow) }} type="text" placeholder='rate limit window'></input>

    </div>
  )
}

async function updatePolicies(new_policies) {
  const res = await fetch("http://127.0.0.1:3000/policies", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(new_policies)
  }).catch(e => console.log("policy engine is down"))

  if (!res.ok) {
    const err = await res.json();
    alert("Error" + err.error);
    return;
  }

  let p = await res.json();
  setPolicies(p)

}
export default App
