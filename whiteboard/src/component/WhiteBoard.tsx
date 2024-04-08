import { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import jsPDF from "jspdf";
import coverImg from "../assets/bg_img.jpg";

const WhiteboardPage: React.FC = () => {
  // State variables
  const [socket, setSocket] = useState<SocketIOClient.Socket | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);
  const [drawing, setDrawing] = useState<boolean>(false);
  const [prevX, setPrevX] = useState<number>(0);
  const [prevY, setPrevY] = useState<number>(0);
  const [currX, setCurrX] = useState<number>(0);
  const [currY, setCurrY] = useState<number>(0);
  const [color, setColor] = useState<string>("#000000");
  const [brushSize, setBrushSize] = useState<number>(2);
  const [messages, setMessages] = useState<string[]>([]);
  const [newMessage, setNewMessage] = useState<string>("");
  const [uploadedImage, setUploadedImage] = useState<HTMLImageElement | null>(
    null
  );
  const [undoStack, setUndoStack] = useState<ImageData[]>([]);
  const [redoStack, setRedoStack] = useState<ImageData[]>([]);

  // Establishing socket connection
  useEffect(() => {
    const newSocket = io("http://localhost:8080");
    setSocket(newSocket);

    // Cleanup function to close socket connection
    return () => newSocket.close();
  }, []);

  // Initializing canvas context
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      setContext(ctx);
    }
  }, []);

  // Setting up canvas drawing settings
  useEffect(() => {
    if (context) {
      context.lineJoin = "round";
      context.lineCap = "round";
      context.strokeStyle = color;
      context.lineWidth = brushSize;
    }
  }, [context, color, brushSize]);

  // Handling incoming drawing messages from socket
  useEffect(() => {
    if (socket) {
      socket.on("chat message", (msg: string) => {
        setMessages((prevMessages) => [...prevMessages, msg]);
      });

      socket.on("drawing", (data: any) => {
        const { prevX, prevY, currX, currY, color, brushSize } = data;
        if (!context) return;
        context.beginPath();
        context.moveTo(prevX, prevY);
        context.lineTo(currX, currY);
        context.strokeStyle = color;
        context.lineWidth = brushSize;
        context.stroke();
        context.closePath();
      });
    }
  }, [socket, context]);

  // Mouse down event handler
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setDrawing(true);
    if (canvasRef.current) {
      setPrevX(e.nativeEvent.offsetX);
      setPrevY(e.nativeEvent.offsetY);
      clearRedoStack();
    }
  };

  // Mouse move event handler
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!drawing) return;
    if (canvasRef.current) {
      setCurrX(e.nativeEvent.offsetX);
      setCurrY(e.nativeEvent.offsetY);
      draw();
      setPrevX(currX);
      setPrevY(currY);
      if (socket) {
        socket.emit("drawing", {
          prevX,
          prevY,
          currX,
          currY,
          color,
          brushSize,
        });
      }
    }
  };

  // Mouse up event handler
  const handleMouseUp = () => {
    setDrawing(false);
  };

  // Drawing function
  const draw = () => {
    if (!context) return;
    context.beginPath();
    context.moveTo(prevX, prevY);
    context.lineTo(currX, currY);
    context.stroke();
    context.closePath();
    addToUndoStack();
  };

  // Adding canvas state to undo stack
  const addToUndoStack = () => {
    if (!context || !canvasRef.current) return;
    const imageData = context.getImageData(
      0,
      0,
      canvasRef.current.width,
      canvasRef.current.height
    );
    setUndoStack((prevStack) => [...prevStack, imageData]);
  };

  // Clearing redo stack
  const clearRedoStack = () => {
    setRedoStack([]);
  };

  // Undo operation
  const undo = () => {
    if (context && undoStack.length > 0) {
      const lastImageData = undoStack.pop();
      if (lastImageData) {
        setRedoStack((prevStack) => [...prevStack, lastImageData]);
        redrawCanvas();
      }
    }
  };

  // Redo operation
  const redo = () => {
    if (context && redoStack.length > 0) {
      const lastImageData = redoStack.pop();
      if (lastImageData) {
        setUndoStack((prevStack) => [...prevStack, lastImageData]);
        redrawCanvas();
      }
    }
  };

  // Redraw canvas
  const redrawCanvas = () => {
    if (context && canvasRef.current) {
      context.clearRect(
        0,
        0,
        canvasRef.current.width,
        canvasRef.current.height
      );
      undoStack.forEach((imageData) => {
        context.putImageData(imageData, 0, 0);
      });
    }
  };

  // Saving canvas as PDF
  const saveAsPDF = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const dataURL = canvas.toDataURL("image/jpeg", 1.0);

    const pdf = new jsPDF("l", "px", [canvas.width, canvas.height]);
    pdf.addImage(dataURL, "JPEG", 0, 0, canvas.width, canvas.height);
    pdf.save("whiteboard.pdf");
  };

  // Handling chat message
  const handleChatMessage = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && socket) {
      socket.emit("chat message", newMessage);
      setNewMessage("");
    }
  };

  // Handling image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        setUploadedImage(img);
        if (context && canvasRef.current) {
          context.drawImage(img, 0, 0, 800, 600);
        }
      };
      if (event.target) {
        img.src = event.target.result as string;
      }
    };
    reader.readAsDataURL(file);
  };

  // JSX rendering
  return (
    <div
      className="min-h-screen bg-cover bg-center relative"
      style={{ backgroundImage: `url(${coverImg})` }}
    >
      <div className="absolute inset-0 bg-black opacity-25"></div>
      <div className="flex flex-col justify-center items-center p-8 relative z-10">
        <h1 className="text-3xl font-bold mb-4 text-white">
          Real-Time Collaborative Whiteboard
        </h1>
        <div className="flex w-full justify-between items-center">
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="p-1 border bg-gray-400 border-gray-400 rounded-md mr-2"
          />
          <input
            type="number"
            value={brushSize}
            onChange={(e) => setBrushSize(parseInt(e.target.value))}
            min="1"
            max="10"
            className="p-1 border bg-gray-400 border-gray-400 rounded-md mr-2"
          />
          <button
            onClick={saveAsPDF}
            className="p-2 border bg-gray-400 border-gray-400 rounded-md mr-2"
          >
            Save as PDF
          </button>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="p-2 border bg-gray-400 border-gray-400 rounded-md mr-2"
          />
          <div>
            <button
              onClick={undo}
              className="p-2 border bg-gray-400 border-gray-400 rounded-md mr-2"
            >
              Undo
            </button>
            <button
              onClick={redo}
              className="p-2 border bg-gray-400 border-gray-400 rounded-md"
            >
              Redo
            </button>
          </div>
        </div>
        <div className="flex h-full w-full mt-4">
          <canvas
            ref={canvasRef}
            className="bg-white border border-gray-400"
            width={1000}
            height={600}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onTouchStart={handleMouseDown}
            onTouchMove={handleMouseMove}
            onTouchEnd={handleMouseUp}
          />
          <div className="flex flex-col ml-10 p-5 border bg-gray-600 border-gray-400 rounded-md">
            <ul className="flex-1 overflow-y-auto text-white">
              {messages.map((msg, index) => (
                <li key={index}>{msg}</li>
              ))}
            </ul>
            <input
              type="text"
              placeholder="Type your message and press Enter to send"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleChatMessage}
              className="mt-2 p-2 w-full border border-gray-400 rounded-md"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhiteboardPage;
