import cv2
import requests
import threading

def send_frame_to_server(frame_bytes):
    """
    Gửi khung hình (dưới dạng byte) đến web server.
    """
    try:
        response = requests.post(
            'http://localhost:5000/uploads',
            files={'file': ('frame.jpg', frame_bytes, 'image/jpeg')}
        )
        
        # Kiểm tra mã trạng thái HTTP
        if response.status_code == 200:
            print("Khung hình đã được gửi thành công")
        else:
            print(f"Đã xảy ra lỗi khi gửi khung hình: {response.status_code} - {response.text}")
    except requests.RequestException as e:
        print(f"Đã xảy ra lỗi khi gửi yêu cầu: {e}")

def process_and_send_frame(frame):
    """
    Chuyển đổi khung hình sang định dạng JPEG và gửi lên server.
    """
    _, buffer = cv2.imencode('.jpg', frame)
    frame_bytes = buffer.tobytes()
    # Gửi khung hình lên server trong một luồng riêng
    threading.Thread(target=send_frame_to_server, args=(frame_bytes,)).start()

def main():
    # Mở camera
    cap = cv2.VideoCapture(0)

    while True:
        ret, frame = cap.read()
        if not ret:
            print("Không thể đọc khung hình từ camera.")
            break

        cv2.imshow('Camera', frame)
        
        # Xử lý và gửi khung hình trong luồng riêng
        process_and_send_frame(frame)

        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    # Giải phóng camera và đóng cửa sổ hiển thị
    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()
