import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Megaphone, Users, Shield } from 'lucide-react';

const About = () => {
  const navigate = useNavigate();
<section class="container">
  <h1>About AdsExchange</h1>

  <p>
    AdsExchange is a digital platform built to connect advertisers with promoters for effective social media marketing campaigns.
  </p>

  <p>
    Our mission is to help businesses grow faster by allowing them to reach real users through task-based promotion systems.
  </p>

  <h2>Our Vision</h2>
  <p>
    To become a trusted global platform where individuals can earn by promoting content and businesses can scale their reach affordably.
  </p>

  <h2>Who We Are</h2>
  <p>
    AdsExchange was created by a group of independent developers focused on building practical digital earning solutions for the next generation.
  </p>

  <h2>Contact</h2>
  <p>Email: support@adsexchange.com</p>
</section>
export default NotFound;
