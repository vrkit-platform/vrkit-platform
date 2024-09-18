import cv2
import numpy as np
# read image
#  1332*810*4
width, height = 1332, 810
img_file = 'Y:\\data\\local-share\\vrkit\\raw-frames\\track-map-0-frame\\track-map-0-frame-014.raw'
fd = open(img_file, 'rb')
img_data = fd.read()
fd.close()

# image = cv2.imread()
# # show the image, provide window name first
# cv2.imshow('image window', image)

#width, height = 100, 100
#image_bytearray = bytearray([255, 0, 0, 255] * (width * height))  # Example data, 100x100 red pixels with full alpha
img_arr = bytearray(img_data)
# Convert bytearray to numpy array
nparr = np.frombuffer(img_arr, np.uint8)

# Reshape the numpy array to the shape of the image (height, width, 4)
img_rgba = nparr.reshape((height, width, 4))

# Display the image
cv2.imshow('RGBA Image', img_rgba)

# Wait until a key is pressed
cv2.waitKey(0)

# Close all OpenCV windows
cv2.destroyAllWindows()

#
# # add wait key. window waits until user presses a key
# cv2.waitKey(0)
# # and finally destroy/close all open windows
cv2.destroyAllWindows()