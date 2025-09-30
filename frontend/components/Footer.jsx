import {FaGithub,FaLinkedin } from "react-icons/fa";
export default function Footer() {
  return (
    <div className=" bg-[url(./assets/img2.jpg)] bg-cover">
    <footer className="foot bg-gray/55 backdrop-blur-lg flex items-center justify-between w-full h-24 text-white border-t border-w">
      <div className="icons flex space-x-2 pl-6">
        <a href ="https://github.com/Ojas2217/Getaway"><FaGithub className="g size-12 hover:scale-110 transition"/></a>
        <a href ="https://www.linkedin.com/in/ojas-pandey-06a318240/"><FaLinkedin className="l size-12 hover:scale-110 transition"/></a>
      </div>



      <div className="copyright font-semibold text-sm lg:text-xl text-wrap">
        <p className=" mr-4 w-max">Made by Ojas ©{(new Date()).getFullYear()}</p>
      </div>

    </footer>
    </div>
  )
}