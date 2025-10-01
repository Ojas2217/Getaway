export default function About() {
    return (
        <div className=" text-[#693f39]">
            <h1 className=" p-6 pb-2  border-gray-500">What is an API Gateway?</h1>
            <p className=" p-6 pt-2 border-b text-3xl/loose">
                An API Gateway acts as a reverse proxy between the client and backend services <br></br>
                In simple terms, it intercepts client requests and performs validation, caching, routing etc.. <br></br>
                This relieves load off of the backend as common concerns such as security, traffic management, and request handling, are handled by the gateway which allows the backend to focus only on business logic.
            </p>
            <h1 className="p-6 pb-2">What is Getaway?</h1>
            <p className=" p-6 pt-2 text-3xl/loose">Getaway is a lightweight API Gateway written entirely in Rust. <br></br>
                At its core it consists of three parts: <br></br>
                1. The Gateway which runs on a hyper server,  it is responsible for: <br></br>
                &nbsp; &nbsp; a. Caching Responses<br></br>                                            
                &nbsp; &nbsp; b. Authorizing requests<br></br>                                            
                &nbsp; &nbsp; c. Routing requests to the correct service<br></br>                                         
                &nbsp; &nbsp; d. Timing out and Rate Limiting requests <br></br>                                         
                2. The policy engine which performs CRUD operations related to the policies set by the user<br></br>
                3. The Dashboard, which is where you are now! Here you can integrate the gateway with your project<br></br> 
                &emsp; to view and edit existing policies.<br></br>
                Below is a diagram which makes it clear how these different parts interact with each other :
            
                
            </p>
        </div>
    )
}