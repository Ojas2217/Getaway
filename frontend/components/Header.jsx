export default function Header() {
    return (

        <div className=" bg-[url(./assets/img2.jpg)] bg-cover">
            <header className=" head  w-full h-24 pt-4 pb-4 pl-8 pr-8 filter backdrop-blur text-white flex items-center justify-between border-b border-gray-500">
                <div className=" text-2xl">Dashboard</div>
                <div className=" text-2xl">Logs</div>
                <div className=" text-5xl">Getaway</div>
                <div className=" text-2xl">About</div>
                <div className=" text-2xl">Docs</div>
            </header>
        </div>

    )
}