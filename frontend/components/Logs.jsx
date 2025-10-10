import React, { useEffect } from 'react';
import { useState } from 'react';
export default function Logs() {
    const [logs, setLogs] = React.useState("");
    useEffect(() => {
        fetch("http://127.0.0.1:3000/logs")
            .then(res => res.json())
            .then(res =>{
                if (res.logs) {
                    const reversed = res.logs
                        .split('\n')       
                        .reverse()        
                        .join('\n');       
                    setLogs(reversed);
                }})

    }, []);
    console.log(logs)
    return (
        <div className="">
            <h1 className=" text-3xl p-6 text-[#693f39]">Logs</h1>
            <div className=' bg-[url(./assets/img2.jpg)] bg-cover rounded-3xl shadow-md shadow-black/30 m-4  '>
                <div className=" overflow-y-auto rounded-3xl w-auto h-[600px] p-8 pt-1 filter backdrop-blur text-white flex flex-col items-start justify-start">
                    <pre className="whitespace-pre-wrap break-all">{logs}</pre>
                </div>
            </div>
        </div>
    )

}