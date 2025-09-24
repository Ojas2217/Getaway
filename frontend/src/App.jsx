import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [policies, setPolicies] = useState({})
  useEffect(()=>{
    fetch("http://127.0.0.1:3000/policies").
    then(res => res.json()). 
    then(setPolicies(res));
  },[])

  return (
    <div class=" ">policies</div>
  )
}
async function updatePolicies(new_policies) {
  const res = await fetch("http://127.0.0.1:3000/policies",{
    method: "PUT",
    headers: {"content-type":"application/json"},
    body: JSON.stringify(new_policies)
  })

  if (!res.ok){
    const err = await res.json();
    alert("Error" + err.error);
    return;
  }

  let p = await res.json();
  setPolicies(p)

}
export default App
