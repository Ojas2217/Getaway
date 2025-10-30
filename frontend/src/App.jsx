import { useState, useEffect } from 'react'
import Header from '../components/header'
import Footer from '../components/Footer'

function App() {
  const [policies, setPolicies] = useState({})
  const [backend, setBackend] = useState("")
  const [prefix, setPrefix] = useState("")
  const [cachedur, setCachedur] = useState(0)
  const [reqTimeout, setReqTimeout] = useState(0)
  const [rateRequests, setRateRequests] = useState(0)
  const [rateWindow, setRateWindow] = useState(0)
  const [authMap, setAuthMap] = useState(new Map());
  const [upToDate, setUpToDate] = useState(2); //0=not updated,1=loading,2=updated

  useEffect(() => {
    fetch(`http://${import.meta.env.VITE_POLICY_ADDR}/policies`)
      .then(res => res.json())
      .then(res => setPolicies(res))
      .catch(e => alert("Policy engine is down : " + e));
  }, []);
  useEffect(() => {
    if (policies.backend) setBackend(policies.backend)
    if (policies.path_prefix) setPrefix(policies.path_prefix)
    if (policies.cache_duration) setCachedur(policies.cache_duration)
    if (policies.request_timeout) setReqTimeout(policies.request_timeout)
    if (policies.rate_limit) {
      if (policies.rate_limit.rate_limit_requests) setRateRequests(policies.rate_limit.rate_limit_requests)
      if (policies.rate_limit.rate_limit_window) setRateWindow(policies.rate_limit.rate_limit_window)
    }
    if (policies.authorization) setAuthMap(new Map(Object.entries(policies.authorization)))
  }, [policies])


  async function handleUpdate() {
    setReqTimeout(!reqTimeout ? 0 : reqTimeout)
    setRateRequests(!rateRequests ? 0 : rateRequests)
    setRateWindow(!rateWindow ? 0 : rateWindow)
    setCachedur(!cachedur ? 0 : cachedur)
    if (!backend) {
      alert("Backend URL cannot be empty");
      return;
    }
    let p = {
      "backend": backend,
      "path_prefix": prefix,
      "rate_limit": {
        "rate_limit_requests": rateRequests,
        "rate_limit_window": rateWindow
      },
      "authorization": Object.fromEntries(authMap),
      "cache_duration": cachedur,
      "request_timeout": reqTimeout
    }
    await updatePolicies(p)
  }


  async function updatePolicies(new_policies) {
    setUpToDate(1)
    const res = await fetch(`http://${import.meta.env.VITE_POLICY_ADDR}/policies`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(new_policies)
    }).catch(e => alert("policy engine is down"))
    
    if (!res.ok) {
      const err = await res.json();
      alert("Error " + err.error);
      setPolicies(err.old);
      setUpToDate(2)
      return;
    }

    let p = await res.json();
    setPolicies(p)

    setTimeout(() => {
      setUpToDate(2)
    }, 500);

  }
  const add = () => {
    setAuthMap(new Map(authMap.set("", "")));
  };


  const remove = (token) => {
    const updated = new Map(authMap);
    updated.delete(token);
    setAuthMap(updated);
  };

  const update = (oldToken, newToken, newUser) => {
    const updated = new Map(authMap);
    updated.delete(oldToken);
    if (newToken) {
      updated.set(newToken, newUser);
    }
    setAuthMap(updated);
    checkUpd(JSON.stringify(policies.authorization), JSON.stringify(Object.fromEntries(Array.from(updated))))
  };
  const checkUpd = (oldVal, newVal,isNum = false) => {
    if(isNum){
      newVal = Number(newVal)
    }
    if (oldVal !== newVal) {
      setUpToDate(0)
    } else {
      setUpToDate(2)
    }
  }
return (
  <div className="text-[#693f39] min-h-screen">

    <div className="flex flex-col items-start justify-between border-gray-500 border-b p-6 space-y-10">
      <div className="flex flex-col md:flex-row justify-between w-full gap-4">
        <h1>Backend</h1>
        <div className="flex flex-col md:flex-row md:space-x-5 space-y-3 md:space-y-0 items-start md:items-center w-full md:w-auto">
          <h2>{upToDate == 2 ? "All Policies are Up to Date" : (upToDate == 0 ? "Unsaved changes" : "Updating..")}</h2>
          <button className={`${upToDate == 2 ? "bg-[#73e781]" : (upToDate == 1 ? "bg-[#6c6262]" : "bg-[#ff1900b8]")} border-none opacity-80 hover:opacity-100 hover:scale-110 outline-0 rounded-md w-full md:w-40 p-1.5 text-xl`} onClick={handleUpdate}>Update Policies</button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:space-x-7 space-y-4 md:space-y-0 w-full">
        <input className="bg-[#c2241241] border-none outline-0 rounded-md w-full md:w-56 p-1.5" onChange={e => { checkUpd(policies.backend, e.target.value); setBackend(e.target.value) }} type="text" placeholder="backend URL" value={backend}></input>
        <h2 className="break-words">The full URL to your backend, eg: https://backend.com</h2>
      </div>

      <div className="flex flex-col md:flex-row md:space-x-7 space-y-4 md:space-y-0 w-full">
        <input className="bg-[#c2241241] border-none outline-0 rounded-md w-full md:w-56 p-1.5" onChange={e => { checkUpd(policies.path_prefix, e.target.value); setPrefix(e.target.value) }} type="text" placeholder="prefix (blank if none)" value={prefix}></input>
        <h2 className="break-words">an optional prefix for your backend eg: if requests are sent to /api/backend the prefix would be /api</h2>
      </div>
    </div>

    <div className="flex flex-col items-start justify-between border-gray-500 border-b p-6 space-y-10">
      <div className="flex flex-col md:flex-row md:space-x-7 space-y-4 md:space-y-0 items-start md:items-center w-full">
        <h1>Authorization</h1>
        <h2>Add tokens to validate users. The token must be sent in the Authorization header as Bearer token</h2>
      </div>

      {Array.from(authMap.entries()).map(([token, user], index) => (
        <div key={index} className="flex flex-col md:flex-row md:space-x-7 space-y-4 md:space-y-0 w-full">
          <input className="bg-[#c2241241] border-none outline-0 rounded-md w-full md:w-auto p-1.5" type="text" placeholder="token (unique)" value={token} onChange={e => { update(token, e.target.value, user); }} />
          <input className="bg-[#c2241241] border-none outline-0 rounded-md w-full md:w-56 p-1.5" type="text" placeholder="user" value={user} onChange={e => { update(token, token, e.target.value); }} />
          <button className="bg-[#ff1900b8] border-none opacity-80 hover:opacity-100 hover:scale-110 outline-0 rounded-md w-full md:w-40 p-1.5" onClick={() => remove(token)}>Remove</button>
        </div>
      ))}
      <button className="bg-[#ff1900b8] border-none opacity-80 hover:opacity-100 hover:scale-110 outline-0 rounded-md w-full md:w-40 p-1.5" onClick={add}>Add User</button>
    </div>

    <div className="flex flex-col items-start justify-between border-gray-500 border-b p-6 space-y-10">
      <h1>Cache</h1>
      <div className="flex flex-col md:flex-row md:space-x-7 space-y-4 md:space-y-0 items-start md:items-center w-full">
        <input className="bg-[#c2241241] border-none outline-0 rounded-md w-full md:w-56 p-1.5" onChange={e => { if (/^[0-9]*$/.test(e.target.value)) checkUpd(policies.cache_duration, e.target.value, true); setCachedur(Number(e.target.value)) }} type="text" value={cachedur} placeholder="cache duration (seconds)"></input>
        <h2 className="break-words">Cache duration in seconds. Responses will be cached for this duration. Set to 0 to disable caching (default)</h2>
      </div>
    </div>

    <div className="flex flex-col items-start justify-between p-6 space-y-10">
      <h1>Timeout & Rate Limit</h1>

      <div className="flex flex-col md:flex-row md:space-x-7 space-y-4 md:space-y-0 items-start md:items-center w-full">
        <input className="bg-[#c2241241] border-none outline-0 rounded-md w-full md:w-56 p-1.5" onChange={e => { if (/^[0-9]*$/.test(e.target.value)) checkUpd(policies.request_timeout, e.target.value, true); setReqTimeout(Number(e.target.value)) }} type="text" value={reqTimeout} placeholder="timeout duration (seconds)"></input>
        <h2 className="break-words">Request timeout duration in seconds. Requests taking longer will be aborted. Set to 0 to disable (default).</h2>
      </div>

      <div className="flex flex-col md:flex-row md:space-x-7 space-y-4 md:space-y-0 items-start md:items-center w-full">
        <input className="bg-[#c2241241] border-none outline-0 rounded-md w-full md:w-56 p-1.5" onChange={e => { if (/^[0-9]*$/.test(e.target.value)) checkUpd(policies.rate_limit.rate_limit_requests, e.target.value, true); setRateRequests(Number(e.target.value)) }} type="text" value={rateRequests} placeholder="rate limit after X requests"></input>
        <h2 className="break-words">Rate Limit — the maximum number of requests a user can make within the specified time window.</h2>
      </div>

      <div className="flex flex-col md:flex-row md:space-x-7 space-y-4 md:space-y-0 items-start md:items-center w-full">
        <input className="bg-[#c2241241] border-none outline-0 rounded-md w-full md:w-56 p-1.5" onChange={e => { if (/^[0-9]*$/.test(e.target.value)) checkUpd(policies.rate_limit.rate_limit_window, e.target.value, true); setRateWindow(Number(e.target.value)) }} type="text" value={rateWindow} placeholder="rate limit window"></input>
        <h2 className="break-words">Rate Limit Window — the duration of the rate limit window, in seconds.</h2>
      </div>
    </div>
  </div>
)

}


export default App
