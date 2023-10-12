import numpy as np
import matplotlib.pyplot as plt

from utils import bp_function as calc_Z

# def calc_Z(A, B):
#     return np.sqrt(A) * np.sqrt(B)

# Define the range for A and B
Amin, Amax = 1, 90
Bmin, Bmax = 0, 5

# Create a meshgrid for A and B
A, B = np.meshgrid(np.linspace(Amin, Amax, 100), np.linspace(Bmin, Bmax, 100))

# Compute Z values. Function needs to be vectorised
vect_func = np.vectorize(calc_Z)
Z = vect_func(A, B)

# Create a surface plot
fig = plt.figure()
ax = fig.add_subplot(111, projection='3d')
ax.plot_surface(A, B, Z, cmap='viridis')


# Set labels and title
ax.set_xlabel('Time')
ax.set_ylabel('Grossness')
ax.set_zlabel('BP Score')

ax.set_zlim(0, 300)

# Show the plot
plt.show()
