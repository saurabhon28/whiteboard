import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { API_END_POINT } from "../utils/constant";
import coverImg from "../assets/bg_img.jpg";

function Login() {
  const navigate = useNavigate();
  const [isUser, setIsUser] = useState<boolean>(false); // State for user type (login/signup)
  const [fullName, setFullName] = useState<string>(""); // State for full name input
  const [email, setEmail] = useState<string>(""); // State for email input
  const [password, setPassword] = useState<string>(""); // State for password input

  // Toggle between login and signup forms
  const userHandler = () => {
    setIsUser(!isUser);
  };

  // Handler for full name input change
  const nameHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFullName(e.target.value);
  };

  // Handler for email input change
  const emailHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  // Handler for password input change
  const passwordHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  // Handle form submission
  const getInputData = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // Prevent default form submission behavior
    if (isUser) {
      // If it's a login attempt
      const loginUser = { email, password }; // Prepare login data
      try {
        const res = await axios.post(`${API_END_POINT}/login`, loginUser, {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true, // Send cookies with the request
        });
        console.log(res);
        if (res.data.success) {
          toast.success(res.data.message); // Display success message
        }
        navigate("/home"); // Redirect to home page after successful login
      } catch (error) {
        toast.error(error.response.data.message); // Display error message
        console.log(error);
      }
    } else {
      // If it's a signup attempt
      const registerUser = { fullName, email, password }; // Prepare registration data
      try {
        const res = await axios.post(`${API_END_POINT}/register`, registerUser);
        console.log(res);
        if (res.data.success) {
          toast.success(res.data.message); // Display success message
        }
        setIsUser(true); // Switch to login after successful signup
      } catch (error) {
        toast.error(error.response.data.message); // Display error message
        console.log(error);
      }
    }

    // Clear input fields after form submission
    setFullName("");
    setEmail("");
    setPassword("");
  };

  return (
    <>
      {/* Background image */}
      <div className="absolute">
        <img
          className="w-[100vw] h-[100vh] object-cover"
          src={coverImg}
          alt="cover"
        />
      </div>
      {/* Login/signup form */}
      <form
        onSubmit={getInputData}
        action=""
        className="p-10 m-2 flex flex-col items-center justify-center absolute w-3/4 md:w-3/12 my-36 mx-auto left-0 right-0 bg-black rounded-md opacity-95">
        {/* Form title */}
        <h1 className="text-white text-3xl mb-5 font-bold">
          {isUser ? "Login" : "Signup"}
        </h1>
        {/* Input fields */}
        <div className="flex flex-col w-full md:w-60">
          {!isUser && (
            <input
              value={fullName}
              onChange={nameHandler}
              className="outline-none p-3 my-2 rounded-sm bg-gray-800 text-white"
              type="text"
              placeholder="Enter Fullname"
            />
          )}
          <input
            value={email}
            onChange={emailHandler}
            className="outline-none p-3 my-2 rounded-sm bg-gray-800 text-white"
            type="text"
            placeholder="Enter E-mail"
          />
          <input
            value={password}
            onChange={passwordHandler}
            className="outline-none p-3 my-2 rounded-sm bg-gray-800 text-white"
            type="password"
            placeholder="Enter Password"
          />
          {/* Submit button */}
          <button className="p-2 mt-2 mb-2 bg-red-800 text-white font-bold rounded-md">
            {isUser ? "Login" : "Signup"}
          </button>
          {/* Option to switch between login and signup */}
          <p className="text-white">
            {isUser ? "New to Flixxit?" : "Already have an account?"}
            <span
              onClick={userHandler}
              className="text-blue-600 mx-1 font-medium cursor-pointer">
              {isUser ? "Signup" : "Login"}
            </span>
          </p>
        </div>
      </form>
    </>
  );
}

export default Login;

