export default function Header() {
    return (

        <div className=" bg-[url(./assets/img2.jpg)] bg-cover rounded-3xl shadow-md shadow-black/30  m-4">
            <header className=" head rounded-3xl shadow-lg shadow-black/30 w-full h-24 pt-4 pb-4 pl-8 pr-8 filter backdrop-blur text-white flex items-center justify-between border-b border-gray-500">
                <a href="/dashboard" className=" text-2xl hover:scale-120 transition">Dashboard</a>
                <a href="/logs"  className=" text-2xl hover:scale-120 transition">Logs</a>
                <div className=" text-5xl">Getaway</div>
                <a href="/about"  className=" text-2xl hover:scale-120 transition">About</a>
                <a href="/docs"  className=" text-2xl hover:scale-120 transition">Docs</a>
            </header>
        </div>

    )
}