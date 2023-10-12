import numpy as np
import matplotlib.pyplot as plt
from datetime import timedelta

from utils import bp_function as calc_Z

# Define the range for A and B
Amin, Amax = 10, 60  # In minutes
Bmin, Bmax = 0, 5

# Create a meshgrid for A and B
A_values = np.linspace(Amin, Amax, 100)
B_values = np.linspace(Bmin, Bmax, 100)
A_mesh, B_mesh = np.meshgrid(A_values, B_values)

# Convert A_mesh to timedelta
A_timedelta_mesh = np.vectorize(timedelta)(minutes=A_mesh)

# Compute Z values using vectorized function
vfunc = np.vectorize(calc_Z)
Z = vfunc(A_timedelta_mesh, B_mesh)

# Create a surface plot
fig = plt.figure()
ax = fig.add_subplot(111, projection='3d')
ax.plot_surface(A_mesh, B_mesh, Z, cmap='viridis')

# Set labels and title
ax.set_xlabel('Completion Time (minutes)')
ax.set_ylabel('Grossness')
ax.set_zlabel('BP Score')
ax.set_title('BP Calculation')

# Show the plot
plt.show()
