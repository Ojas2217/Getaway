export default function Header() {
    return (

        <div className=" bg-[url(./assets/img2.jpg)] bg-cover rounded-3xl shadow-md shadow-black/30  m-4">
            <header className=" head rounded-3xl shadow-lg text-sm md:text-2xl shadow-black/30 w-auto h-24 pt-4 pb-4 pl-8 pr-8 filter backdrop-blur text-white flex items-center justify-between border-b border-gray-500">
                <a href="/dashboard" className=" hover:scale-120 transition">Dashboard</a>
                <a href="/logs"  className="  hover:scale-120 transition">Logs</a>
                <div className=" md:text-5xl text-lg text-bold">Getaway</div>
                <a href="/docs"  className="  hover:scale-120 transition">Docs</a>
                <a href="/about"  className="  hover:scale-120 transition">About</a>
                
            </header>
        </div>

    )
}